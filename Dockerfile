FROM node:25 AS frontend
WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci                        
COPY frontend/ .
RUN npm run build

FROM golang:1.25 AS backend
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download 
COPY . .
COPY --from=frontend /app/dist ./dist
RUN go build -o server .

FROM debian:bookworm-slim
COPY --from=backend /app/server .
COPY --from=frontend /app/dist ./dist 

CMD ["./server"]