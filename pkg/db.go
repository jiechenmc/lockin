package database

import (
	"context"
	"database/sql"
	"os"
	"time"

	"github.com/uptrace/bun"
	"github.com/uptrace/bun/dialect/pgdialect"
	"github.com/uptrace/bun/driver/pgdriver"
)

type Record struct {
	ID        int64     `bun:"id,pk,autoincrement"`
	Name      string    `bun:"name,notnull"`
	CreatedAt time.Time `bun:"createdAt,notnull"`
}

type DBServer struct {
	Conn *bun.DB
}

func Connect() *DBServer {
	// Connect to database
	sqldb := sql.OpenDB(pgdriver.NewConnector(pgdriver.WithDSN(os.Getenv("DB_URI"))))
	db := bun.NewDB(sqldb, pgdialect.New())
	return &DBServer{Conn: db}
}

func (s *DBServer) ResetTable() error {
	_, err := s.Conn.NewDropTable().
		Model((*Record)(nil)).
		IfExists().
		Exec(context.Background())
	if err != nil {
		return err
	}
	return s.CreateTable()
}

func (s *DBServer) CreateTable() error {
	_, err := s.Conn.NewCreateTable().
		Model((*Record)(nil)).
		IfNotExists().
		Exec(context.Background())
	return err
}

func (s *DBServer) AddRecord(name string) (sql.Result, error) {
	record := &Record{Name: name, CreatedAt: time.Now()}
	return s.Conn.NewInsert().Model(record).Exec(context.Background())
}

func (s *DBServer) GetLastRecord(name string) (*Record, error) {
	record := &Record{}
	err := s.Conn.NewSelect().
		Model(record).
		Where("name = ?", name).
		Where("created_at >= ?", time.Now().Add(-60*time.Minute)).
		Limit(1).
		Scan(context.Background())
	if err != nil {
		return nil, err
	}
	return record, nil
}
func (s *DBServer) GetAllRecord() ([]Record, error) {
	var records []Record
	err := s.Conn.NewSelect().
		Model(&records).
		Scan(context.Background())
	if err != nil {
		return nil, err
	}
	return records, nil
}
