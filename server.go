package main

import (
	"context"
	"database/sql"
	database "lockin/pkg"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"go.opentelemetry.io/contrib/instrumentation/github.com/gin-gonic/gin/otelgin"
	"go.opentelemetry.io/otel"
	"go.opentelemetry.io/otel/exporters/otlp/otlptrace/otlptracegrpc"
	"go.opentelemetry.io/otel/sdk/resource"
	sdktrace "go.opentelemetry.io/otel/sdk/trace"
	semconv "go.opentelemetry.io/otel/semconv/v1.21.0"
)

type AddRequest struct {
	Name string `json:"name"`
	Tz   string `json:"tz"`
}

func ZerologMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()

		c.Next()

		log.Info().
			Str("method", c.Request.Method).
			Str("path", c.Request.URL.Path).
			Int("status", c.Writer.Status()).
			Dur("latency", time.Since(start)).
			Str("client_ip", c.ClientIP()).
			Msg("request")
	}
}

func initTracer(ctx context.Context) (func(), error) {
	exp, err := otlptracegrpc.New(ctx,
		otlptracegrpc.WithEndpoint("jaeger:4317"),
		otlptracegrpc.WithInsecure(),
	)
	if err != nil {
		return nil, err
	}

	tp := sdktrace.NewTracerProvider(
		sdktrace.WithBatcher(exp),
		sdktrace.WithResource(resource.NewWithAttributes(
			semconv.SchemaURL,
			semconv.ServiceNameKey.String("lockin"),
		)),
	)

	// Register as the global provider
	otel.SetTracerProvider(tp)

	// Return a shutdown function
	return func() {
		_ = tp.Shutdown(ctx)
	}, nil
}

func main() {
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix

	if gin.Mode() == gin.DebugMode {
		log.Logger = log.Output(zerolog.ConsoleWriter{Out: os.Stderr})
	}

	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(ZerologMiddleware())
	r.Use(otelgin.Middleware("lockin"))

	shutdown, err := initTracer(context.Background())
	if err != nil {
		log.Err(err)
	}
	defer shutdown()

	db := database.Connect()
	defer db.Conn.Close()

	if err := db.CreateTable(); err != nil {
		log.Err(err)
	}

	r.POST("/api/add", func(c *gin.Context) {
		var req AddRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request"})
			return
		}

		existing, err := db.GetLastRecord(req.Name, req.Tz)
		if err == nil && existing != nil {
			c.JSON(http.StatusConflict, gin.H{"error": "record already exists today"})
			return
		}

		if err != nil && err != sql.ErrNoRows {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		if existing != nil {
			c.JSON(http.StatusConflict, gin.H{"error": "record already exists in the last hour"})
			return
		}

		if _, err = db.AddRecord(req.Name); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "record added"})
	})

	r.GET("/api/get", func(c *gin.Context) {
		record, err := db.GetLastRecord(c.Query("name"), c.Query("tz"))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, record)
	})

	r.GET("/api", func(c *gin.Context) {
		records, err := db.GetAllRecord()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, records)
	})

	r.PATCH("/api/ack", func(c *gin.Context) {
		name := c.Query("name")
		tz := c.Query("tz")
		if name == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "name is required"})
			return
		}

		if err := db.AckRecord(name, tz); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"message": "ack updated"})
	})

	r.Static("/assets", "dist/assets")

	// Explicit root
	r.StaticFile("/", "dist/index.html")

	// SPA fallback — any unmatched route serves index.html
	r.NoRoute(func(c *gin.Context) {
		c.File("dist/index.html")
	})

	if err := r.Run(":1323"); err != nil {
		log.Err(err)
	}
}
