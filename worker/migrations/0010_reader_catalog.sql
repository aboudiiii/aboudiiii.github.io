-- Mark text-based books for the authenticated Telegram reader after page images are uploaded.
-- Existing coloring/planner downloads remain unchanged.
UPDATE shop_products SET content_type='reader', reader_page_count=124 WHERE product_key='n';
UPDATE shop_products SET content_type='reader', reader_page_count=109 WHERE product_key='r';
UPDATE shop_products SET content_type='reader', reader_page_count=53 WHERE product_key='y';
UPDATE shop_products SET content_type='reader', reader_page_count=62 WHERE product_key='j';
UPDATE shop_products SET content_type='reader', reader_page_count=47 WHERE product_key='v';
UPDATE shop_products SET content_type='reader', reader_page_count=93 WHERE product_key='x';
