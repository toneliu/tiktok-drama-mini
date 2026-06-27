package handlers

import (
	"net/http"
	"strconv"

	"github.com/dramamax/backend/internal/database"
	"github.com/dramamax/backend/internal/models"
	"github.com/gin-gonic/gin"
)

type DramaHandler struct{}

func (h *DramaHandler) GetRecommend(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset := (page - 1) * limit

	if database.IsDemo {
		all := database.MockDramas()
		end := offset + limit
		if end > len(all) {
			end = len(all)
		}
		if offset > len(all) {
			offset = len(all)
		}
		c.JSON(http.StatusOK, gin.H{"data": all[offset:end]})
		return
	}

	var dramas []models.Drama
	database.DB.Model(&models.Drama{}).Where("deleted_at IS NULL").
		Order("view_count DESC, created_at DESC").Offset(offset).Limit(limit).Find(&dramas)
	c.JSON(http.StatusOK, gin.H{"data": dramas})
}

func (h *DramaHandler) GetList(c *gin.Context) {
	category := c.Query("category")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "10"))
	offset := (page - 1) * limit

	if database.IsDemo {
		all := database.MockDramas()
		filtered := all[:0]
		for _, d := range all {
			switch category {
			case "hot":
				if d.IsHot {
					filtered = append(filtered, d)
				}
			case "new":
				if d.IsNew {
					filtered = append(filtered, d)
				}
			case "":
				filtered = append(filtered, d)
			default:
				if d.Category == category {
					filtered = append(filtered, d)
				}
			}
		}
		end := offset + limit
		if end > len(filtered) {
			end = len(filtered)
		}
		if offset > len(filtered) {
			offset = len(filtered)
		}
		c.JSON(http.StatusOK, gin.H{"data": filtered[offset:end]})
		return
	}

	var dramas []models.Drama
	query := database.DB.Model(&models.Drama{}).Where("deleted_at IS NULL")
	if category != "" {
		switch category {
		case "hot":
			query = query.Where("is_hot = ?", true).Order("view_count DESC")
		case "new":
			query = query.Where("is_new = ?", true).Order("created_at DESC")
		default:
			query = query.Where("category = ?", category)
		}
	}
	query.Offset(offset).Limit(limit).Find(&dramas)
	c.JSON(http.StatusOK, gin.H{"data": dramas})
}

func (h *DramaHandler) GetDetail(c *gin.Context) {
	dramaID := c.Param("id")

	if database.IsDemo {
		for _, d := range database.MockDramas() {
			if d.ID.String() == dramaID {
				c.JSON(http.StatusOK, gin.H{"data": d})
				return
			}
		}
		// 返回第一个作为默认
		all := database.MockDramas()
		if len(all) > 0 {
			c.JSON(http.StatusOK, gin.H{"data": all[0]})
			return
		}
		c.JSON(http.StatusNotFound, gin.H{"error": "Drama not found"})
		return
	}

	var drama models.Drama
	if err := database.DB.First(&drama, "id = ?", dramaID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Drama not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": drama})
}

func (h *DramaHandler) GetEpisodes(c *gin.Context) {
	dramaID := c.Param("id")

	if database.IsDemo {
		// 在demo模式下，对任意ID返回mock集数
		all := database.MockDramas()
		target := all[0].ID
		for _, d := range all {
			if d.ID.String() == dramaID {
				target = d.ID
				break
			}
		}
		c.JSON(http.StatusOK, gin.H{"data": database.MockEpisodes(target)})
		return
	}

	var episodes []models.Episode
	database.DB.Where("drama_id = ?", dramaID).Order("episode_number ASC").Find(&episodes)
	c.JSON(http.StatusOK, gin.H{"data": episodes})
}

func (h *DramaHandler) GetPlayURL(c *gin.Context) {
	episodeID := c.Param("episodeId")
	userID := c.GetString("userID")

	if database.IsDemo {
		// 查找集数
		allDramas := database.MockDramas()
		for _, drama := range allDramas {
			eps := database.MockEpisodes(drama.ID)
			for _, ep := range eps {
				if ep.ID.String() == episodeID || ep.PlaySource != "" {
					// 非VIP检查
					if !ep.IsFree {
						// 检查是否VIP用户
						if userID == "" {
							c.JSON(http.StatusForbidden, gin.H{"error": "VIP subscription required", "isFree": false})
							return
						}
					}
					c.JSON(http.StatusOK, gin.H{
						"episode":  ep,
						"episodes": eps,
						"isFree":   ep.IsFree,
					})
					return
				}
			}
		}
		// 默认返回第一个剧的第一集
		eps := database.MockEpisodes(allDramas[0].ID)
		c.JSON(http.StatusOK, gin.H{
			"episode":  eps[0],
			"episodes": eps,
			"isFree":   true,
		})
		return
	}

	var episode models.Episode
	if err := database.DB.First(&episode, "id = ?", episodeID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Episode not found"})
		return
	}

	var user models.User
	database.DB.First(&user, "id = ?", userID)
	if !user.IsVIP && !episode.IsFree {
		c.JSON(http.StatusForbidden, gin.H{"error": "VIP subscription required", "isFree": false})
		return
	}

	var episodes []models.Episode
	database.DB.Where("drama_id = ?", episode.DramaID).Order("episode_number ASC").Find(&episodes)
	c.JSON(http.StatusOK, gin.H{"episode": episode, "episodes": episodes, "isFree": episode.IsFree})
}
