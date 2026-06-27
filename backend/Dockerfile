# Build stage
FROM golang:1.21-alpine AS builder

RUN apk add --no-cache gcc musl-dev

WORKDIR /build

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=1 GOOS=linux go build -ldflags="-s -w" -o dramamax ./cmd/main.go

# Run stage
FROM alpine:3.19

RUN apk add --no-cache ca-certificates

WORKDIR /app

COPY --from=builder /build/dramamax .
COPY --from=builder /build/config/config.yaml ./config/

RUN mkdir -p /app/data

EXPOSE 8080

CMD ["./dramamax"]
