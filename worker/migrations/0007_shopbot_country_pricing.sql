-- Preserve the legacy regional price multipliers without hardcoding them in handlers.
CREATE TABLE shop_countries (
  code TEXT PRIMARY KEY,
  name_ar TEXT NOT NULL,
  name_en TEXT NOT NULL,
  flag TEXT NOT NULL,
  price_multiplier REAL NOT NULL CHECK(price_multiplier > 0 AND price_multiplier <= 10),
  active INTEGER NOT NULL DEFAULT 1
);
INSERT INTO shop_countries(code,name_ar,name_en,flag,price_multiplier) VALUES
('IQ','العراق','Iraq','🇮🇶',1.0),
('SA','السعودية','Saudi Arabia','🇸🇦',1.4),
('KW','الكويت','Kuwait','🇰🇼',1.6),
('JO','الأردن','Jordan','🇯🇴',1.2),
('TR','تركيا','Turkey','🇹🇷',1.0),
('SY','سوريا','Syria','🇸🇾',0.8),
('XX','دولة أخرى','Other country','🌍',1.4);
