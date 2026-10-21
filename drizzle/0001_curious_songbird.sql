PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_links` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`target_url` text NOT NULL,
	`visibility` text DEFAULT 'public' NOT NULL,
	`created_at` text DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')) NOT NULL,
	`hits` integer DEFAULT 0 NOT NULL,
	`last_access_at` text,
	CONSTRAINT "links_visibility_check" CHECK("visibility" in ('public', 'private')),
	CONSTRAINT "links_slug_not_empty" CHECK(length("slug") > 0),
	CONSTRAINT "links_hits_not_negative" CHECK("hits" >= 0)
);
--> statement-breakpoint
INSERT INTO `__new_links`("id", "slug", "target_url", "visibility", "created_at", "hits") SELECT "id", "slug", "target_url", "visibility", "created_at", "hits" FROM `links`;--> statement-breakpoint
DROP TABLE `links`;--> statement-breakpoint
ALTER TABLE `__new_links` RENAME TO `links`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `links_slug_unique` ON `links` (`slug`);