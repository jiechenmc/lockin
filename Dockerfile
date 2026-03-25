FROM node:20 AS frontend
WORKDIR /app
COPY frontend/ .
RUN npm install && npm run build

FROM golang:1.25 AS backend
WORKDIR /app
COPY . .
COPY --from=frontend /app/dist ./dist
RUN go build -o server .

FROM debian:bookworm-slim
COPY --from=backend /app/server .
COPY --from=frontend /app/dist ./dist 

CMD ["./server"]