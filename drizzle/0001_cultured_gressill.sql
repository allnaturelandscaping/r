CREATE TABLE `clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`address` text NOT NULL,
	`phone` varchar(30),
	`frequency` enum('weekly','biweekly','monthly') NOT NULL DEFAULT 'biweekly',
	`notes` text,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scheduled_cuts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`userId` int NOT NULL,
	`scheduledDate` bigint NOT NULL,
	`status` enum('pending','completed','skipped') NOT NULL DEFAULT 'pending',
	`completedAt` bigint,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scheduled_cuts_id` PRIMARY KEY(`id`)
);
