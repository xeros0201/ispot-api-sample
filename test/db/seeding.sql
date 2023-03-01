INSERT INTO sports (id, name)
VALUES (1, 'football') ON CONFLICT DO NOTHING;

INSERT INTO users ("id", "email", "first_name", "last_name", "password", "active", "role") VALUES ('e566e118-b6fa-41ab-af23-4933cf6a8adb', 'admin@gmail.com', 'Admin', 'Admin', '$2b$10$bbgzvylTmQClaD2zn1qqNuhM33MuG9z1OJE24sFpSviZp/ZthcDHy', 't', 'STAFF') ON CONFLICT DO NOTHING;