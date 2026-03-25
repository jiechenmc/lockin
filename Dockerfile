FROM node:25 AS frontend
WORKDIR /app
COPY frontend/package.json frontend/yarn.lock ./
RUN yarn install --frozen-lockfile
COPY frontend/ .
RUN yarn build

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