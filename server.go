package main

import (
	database "lockin/pkg"
	"log"
	"net/http"

	"github.com/labstack/echo/v5"
	"github.com/labstack/echo/v5/middleware"
)

type AddRequest struct {
	Name string `json:"name"`
}

func main() {
	e := echo.New()
	e.Use(middleware.RequestLogger())

	db := database.Connect()
	defer db.Conn.Close()

	if err := db.ResetTable(); err != nil {
		log.Fatal("failed to create table:", err)
	}

	e.Static("/", "dist")

	e.POST("/api/add", func(c *echo.Context) error {
		var req AddRequest
		if err := c.Bind(&req); err != nil {
			return c.JSON(http.StatusBadRequest, map[string]string{"error": "invalid request"})
		}

		_, err := db.AddRecord(req.Name)
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}

		return c.JSON(http.StatusOK, map[string]string{"message": "record added"})
	})

	e.GET("/api/get", func(c *echo.Context) error {
		record, err := db.GetLastRecord(c.QueryParam("name"))
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusOK, record)
	})

	e.GET("/api", func(c *echo.Context) error {
		records, err := db.GetAllRecord()
		if err != nil {
			return c.JSON(http.StatusInternalServerError, map[string]string{"error": err.Error()})
		}
		return c.JSON(http.StatusOK, records)
	})

	if err := e.Start(":1323"); err != nil {
		e.Logger.Error("failed to start server", "error", err)
	}
}
