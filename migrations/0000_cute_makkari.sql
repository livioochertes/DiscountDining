CREATE TABLE "admin_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_id" integer,
	"session_token" varchar NOT NULL,
	"ip_address" varchar,
	"user_agent" text,
	"login_at" timestamp DEFAULT now(),
	"expires_at" timestamp NOT NULL,
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "admin_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar NOT NULL,
	"password_hash" varchar NOT NULL,
	"first_name" varchar NOT NULL,
	"last_name" varchar NOT NULL,
	"role" text DEFAULT 'admin' NOT NULL,
	"permissions" text[] DEFAULT '{}' NOT NULL,
	"is_active" boolean DEFAULT true,
	"last_login" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"admin_id" integer,
	"action" varchar NOT NULL,
	"resource_type" varchar,
	"resource_id" varchar,
	"old_values" text,
	"new_values" text,
	"ip_address" varchar,
	"user_agent" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "campaign_targets" (
	"id" serial PRIMARY KEY NOT NULL,
	"campaign_id" integer,
	"user_id" integer,
	"sent_at" timestamp,
	"opened_at" timestamp,
	"clicked_at" timestamp,
	"converted_at" timestamp,
	"conversion_value" numeric(8, 2),
	"status" varchar DEFAULT 'pending'
);
--> statement-breakpoint
CREATE TABLE "cashback_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"restaurant_id" integer,
	"name" text NOT NULL,
	"description" text,
	"cashback_percentage" numeric(5, 2) NOT NULL,
	"min_spend_to_join" numeric(10, 2) DEFAULT '0.00',
	"min_orders_to_join" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"priority" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "cashback_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"group_id" integer,
	"restaurant_id" integer,
	"transaction_type" varchar NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"source_order_id" integer,
	"source_amount" numeric(10, 2),
	"balance_after" numeric(10, 2) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "commission_payouts" (
	"id" serial PRIMARY KEY NOT NULL,
	"restaurant_id" integer,
	"payout_period_start" timestamp NOT NULL,
	"payout_period_end" timestamp NOT NULL,
	"total_transaction_amount" numeric(12, 2) NOT NULL,
	"total_commission_amount" numeric(10, 2) NOT NULL,
	"net_payout_amount" numeric(10, 2) NOT NULL,
	"transaction_count" integer NOT NULL,
	"status" varchar DEFAULT 'pending',
	"payout_method" varchar NOT NULL,
	"bank_details" text,
	"payout_reference" varchar,
	"processed_at" timestamp,
	"completed_at" timestamp,
	"failure_reason" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "commission_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"restaurant_id" integer,
	"commission_rate" numeric(5, 2) NOT NULL,
	"effective_from" timestamp DEFAULT now(),
	"effective_to" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "credit_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"credit_account_id" integer NOT NULL,
	"transaction_type" varchar NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"order_id" integer,
	"voucher_id" integer,
	"payment_method" varchar,
	"payment_reference" varchar,
	"due_date" timestamp,
	"paid_at" timestamp,
	"balance_after" numeric(10, 2) NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "credit_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"description" text,
	"interest_rate" numeric(5, 2) DEFAULT '0.00',
	"payment_term_days" integer DEFAULT 30,
	"display_order" integer DEFAULT 0,
	"is_custom_amount" boolean DEFAULT false,
	"min_custom_amount" numeric(10, 2),
	"max_custom_amount" numeric(10, 2),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "customer_cashback_balance" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"eatoff_cashback_balance" numeric(10, 2) DEFAULT '0.00',
	"total_cashback_balance" numeric(10, 2) DEFAULT '0.00',
	"total_cashback_earned" numeric(10, 2) DEFAULT '0.00',
	"total_cashback_used" numeric(10, 2) DEFAULT '0.00',
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "customer_cashback_enrollments" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"group_id" integer NOT NULL,
	"enrolled_at" timestamp DEFAULT now(),
	"enrolled_by" varchar,
	"enrolled_by_user_id" integer,
	"total_cashback_earned" numeric(10, 2) DEFAULT '0.00',
	"total_spend_in_group" numeric(10, 2) DEFAULT '0.00',
	"is_active" boolean DEFAULT true,
	"deactivated_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "customer_credit_account" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"credit_limit" numeric(10, 2) DEFAULT '0.00',
	"available_credit" numeric(10, 2) DEFAULT '0.00',
	"used_credit" numeric(10, 2) DEFAULT '0.00',
	"default_display_limit" numeric(10, 2) DEFAULT '1000.00',
	"status" varchar DEFAULT 'not_requested' NOT NULL,
	"credit_type_id" integer,
	"full_name" varchar,
	"cnp" varchar(13),
	"phone" varchar,
	"email" varchar,
	"address" text,
	"city" varchar,
	"county" varchar,
	"postal_code" varchar,
	"employment_status" varchar,
	"monthly_income" numeric(10, 2),
	"employer" varchar,
	"requested_at" timestamp,
	"requested_amount" numeric(10, 2),
	"approved_at" timestamp,
	"approved_by" integer,
	"rejected_at" timestamp,
	"rejection_reason" text,
	"interest_rate" numeric(5, 2) DEFAULT '0.00',
	"payment_term_days" integer DEFAULT 30,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "customer_favorites" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"restaurant_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "customer_general_vouchers" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"general_voucher_id" integer NOT NULL,
	"purchase_price" numeric(10, 2) NOT NULL,
	"purchase_date" timestamp DEFAULT now(),
	"expiry_date" timestamp NOT NULL,
	"usage_count" integer DEFAULT 0,
	"status" text DEFAULT 'active' NOT NULL,
	"qr_code" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "customer_general_vouchers_qr_code_unique" UNIQUE("qr_code")
);
--> statement-breakpoint
CREATE TABLE "customer_loyalty_enrollments" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"group_id" integer NOT NULL,
	"restaurant_id" integer NOT NULL,
	"enrolled_at" timestamp DEFAULT now(),
	"enrolled_by" varchar,
	"enrolled_by_user_id" integer,
	"total_spent_at_restaurant" numeric(10, 2) DEFAULT '0.00',
	"total_discount_received" numeric(10, 2) DEFAULT '0.00',
	"order_count" integer DEFAULT 0,
	"is_active" boolean DEFAULT true,
	"upgraded_from_group_id" integer,
	"upgraded_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "customer_restaurant_cashback" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"restaurant_id" integer NOT NULL,
	"cashback_balance" numeric(10, 2) DEFAULT '0.00',
	"total_earned" numeric(10, 2) DEFAULT '0.00',
	"total_used" numeric(10, 2) DEFAULT '0.00',
	"total_spent" numeric(10, 2) DEFAULT '0.00',
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "customer_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"restaurant_id" integer NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "customer_wallets" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"cash_balance" numeric(10, 2) DEFAULT '0.00',
	"loyalty_points" integer DEFAULT 0,
	"total_points_earned" integer DEFAULT 0,
	"wallet_pin" varchar(6),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"phone" text,
	"password_hash" text,
	"profile_picture" text,
	"balance" numeric(10, 2) DEFAULT '0.00',
	"customer_code" text,
	"customer_qr_code" text,
	"is_profile_complete" boolean DEFAULT false,
	"loyalty_points" integer DEFAULT 0,
	"total_points_earned" integer DEFAULT 0,
	"membership_tier" text DEFAULT 'bronze',
	"age" integer,
	"weight" numeric(5, 2),
	"height" integer,
	"activity_level" text,
	"health_goal" text,
	"dietary_preferences" text[],
	"allergies" text[],
	"dislikes" text[],
	"health_conditions" text[],
	"notify_push" boolean DEFAULT true,
	"notify_email" boolean DEFAULT true,
	"notify_promo" boolean DEFAULT true,
	"two_factor_secret" text,
	"two_factor_enabled" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "customers_email_unique" UNIQUE("email"),
	CONSTRAINT "customers_customer_code_unique" UNIQUE("customer_code")
);
--> statement-breakpoint
CREATE TABLE "deferred_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"voucher_id" integer NOT NULL,
	"original_amount" numeric(10, 2) NOT NULL,
	"bonus_amount" numeric(10, 2) NOT NULL,
	"total_voucher_value" numeric(10, 2) NOT NULL,
	"payment_intent_id" varchar(255),
	"payment_method_id" varchar(255),
	"stripe_customer_id" varchar(255),
	"charge_date" timestamp NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"retry_count" integer DEFAULT 0,
	"last_retry_date" timestamp,
	"max_retries" integer DEFAULT 3,
	"notifications_sent" text[] DEFAULT '{}',
	"created_at" timestamp DEFAULT now(),
	"charged_at" timestamp,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "eatoff_admins" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar NOT NULL,
	"password_hash" varchar NOT NULL,
	"full_name" varchar NOT NULL,
	"role" varchar NOT NULL,
	"permissions" text[] NOT NULL,
	"two_factor_secret" varchar,
	"two_factor_enabled" boolean DEFAULT false,
	"last_login_at" timestamp,
	"is_active" boolean DEFAULT true,
	"created_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "eatoff_admins_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "eatoff_daily_summary" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" varchar NOT NULL,
	"total_orders" integer DEFAULT 0,
	"total_cash_paid" numeric(12, 2) DEFAULT '0.00',
	"total_points_paid" numeric(12, 2) DEFAULT '0.00',
	"total_commission_earned" numeric(10, 2) DEFAULT '0.00',
	"total_amount_owed_to_restaurants" numeric(12, 2) DEFAULT '0.00',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "eatoff_daily_summary_date_unique" UNIQUE("date")
);
--> statement-breakpoint
CREATE TABLE "eatoff_vouchers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"meal_count" integer,
	"price_per_meal" numeric(10, 2),
	"total_value" numeric(10, 2) NOT NULL,
	"discount_percentage" numeric(5, 2) NOT NULL,
	"voucher_type" text DEFAULT 'immediate' NOT NULL,
	"bonus_percentage" numeric(5, 2) DEFAULT '0.00',
	"payment_term_days" integer DEFAULT 0,
	"requires_preauth" boolean DEFAULT false,
	"interest_rate" numeric(5, 2) DEFAULT '0.00',
	"allows_cashback" boolean DEFAULT true,
	"validity_months" integer DEFAULT 12,
	"validity_start_date" timestamp,
	"validity_end_date" timestamp,
	"validity_type" text DEFAULT 'months' NOT NULL,
	"image_url" text,
	"brand_color" text DEFAULT '#FF6B35',
	"is_active" boolean DEFAULT false,
	"priority" integer DEFAULT 3,
	"position" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "general_vouchers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"voucher_type" text NOT NULL,
	"discount_value" numeric(10, 2) NOT NULL,
	"minimum_spend" numeric(10, 2) DEFAULT '0.00',
	"max_discount" numeric(10, 2),
	"price" numeric(10, 2) NOT NULL,
	"original_value" numeric(10, 2) NOT NULL,
	"savings_percentage" numeric(5, 2) NOT NULL,
	"validity_days" integer DEFAULT 365,
	"usage_limit" integer DEFAULT 1,
	"applicable_categories" text[],
	"excluded_restaurants" integer[],
	"is_active" boolean DEFAULT true,
	"stock_quantity" integer DEFAULT 1000,
	"sold_quantity" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "knowledge_base" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" text NOT NULL,
	"category" text NOT NULL,
	"subcategory" text,
	"keywords" text[],
	"is_public" boolean DEFAULT true,
	"is_active_for_ai" boolean DEFAULT true,
	"view_count" integer DEFAULT 0,
	"helpful_count" integer DEFAULT 0,
	"not_helpful_count" integer DEFAULT 0,
	"created_by" integer,
	"last_updated_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "loyal_customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"restaurant_id" integer NOT NULL,
	"category_id" integer,
	"customer_code" text NOT NULL,
	"enrolled_at" timestamp DEFAULT now(),
	"total_visits" integer DEFAULT 0,
	"total_spend" numeric(10, 2) DEFAULT '0.00',
	"last_visit_at" timestamp,
	"notes" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "loyalty_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"restaurant_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"discount_percentage" numeric(5, 2) NOT NULL,
	"min_visits" integer DEFAULT 0,
	"min_spend" numeric(10, 2) DEFAULT '0.00',
	"color" text DEFAULT '#808080',
	"icon" text,
	"sort_order" integer DEFAULT 0,
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "loyalty_groups" (
	"id" serial PRIMARY KEY NOT NULL,
	"restaurant_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"discount_percentage" numeric(5, 2) NOT NULL,
	"min_spend_threshold" numeric(10, 2) DEFAULT '0.00',
	"max_spend_threshold" numeric(10, 2),
	"auto_upgrade_enabled" boolean DEFAULT true,
	"upgrade_to_group_id" integer,
	"tier_level" integer DEFAULT 1,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "marketing_campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"description" text,
	"type" varchar NOT NULL,
	"target_segment" varchar NOT NULL,
	"target_criteria" text,
	"content" text,
	"scheduled_at" timestamp,
	"launched_at" timestamp,
	"completed_at" timestamp,
	"status" varchar DEFAULT 'draft',
	"target_count" integer DEFAULT 0,
	"sent_count" integer DEFAULT 0,
	"open_count" integer DEFAULT 0,
	"click_count" integer DEFAULT 0,
	"conversion_count" integer DEFAULT 0,
	"revenue_generated" numeric(10, 2) DEFAULT '0.00',
	"created_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "menu_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"restaurant_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"image_url" text,
	"ingredients" text[],
	"allergens" text[],
	"dietary_tags" text[],
	"spice_level" integer DEFAULT 0,
	"is_available" boolean DEFAULT true,
	"calories" integer,
	"preparation_time" integer,
	"is_popular" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"order_id" integer NOT NULL,
	"menu_item_id" integer NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL,
	"total_price" numeric(10, 2) NOT NULL,
	"special_requests" text
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"restaurant_id" integer NOT NULL,
	"order_number" varchar(50) NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"total_amount" numeric(10, 2) NOT NULL,
	"payment_intent_id" varchar(255),
	"customer_name" varchar(255) NOT NULL,
	"customer_phone" varchar(20) NOT NULL,
	"customer_email" varchar(255) NOT NULL,
	"delivery_address" text,
	"order_type" varchar(20) DEFAULT 'pickup' NOT NULL,
	"special_instructions" text,
	"estimated_ready_time" timestamp,
	"order_date" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	CONSTRAINT "orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "payment_requests" (
	"id" serial PRIMARY KEY NOT NULL,
	"restaurant_id" integer NOT NULL,
	"customer_id" integer NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"description" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"customer_code" text NOT NULL,
	"loyalty_discount_applied" numeric(10, 2) DEFAULT '0.00',
	"final_amount" numeric(10, 2) NOT NULL,
	"payment_method" text,
	"stripe_payment_intent_id" text,
	"expires_at" timestamp NOT NULL,
	"confirmed_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "payment_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"restaurant_id" integer NOT NULL,
	"transaction_type" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"payment_method" text NOT NULL,
	"voucher_value" numeric(10, 2) DEFAULT '0.00',
	"points_used" integer DEFAULT 0,
	"cash_used" numeric(10, 2) DEFAULT '0.00',
	"general_voucher_discount" numeric(10, 2) DEFAULT '0.00',
	"platform_commission" numeric(10, 2) NOT NULL,
	"restaurant_receives" numeric(10, 2) NOT NULL,
	"qr_code_scanned" text,
	"transaction_status" text DEFAULT 'pending' NOT NULL,
	"order_id" integer,
	"voucher_id" integer,
	"general_voucher_id" integer,
	"processed_at" timestamp,
	"verified_by" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "personalized_recommendations" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"type" varchar NOT NULL,
	"target_id" integer,
	"recommendation_score" numeric(3, 2),
	"reasoning_factors" text[],
	"nutritional_match" numeric(3, 2),
	"preference_match" numeric(3, 2),
	"health_goal_alignment" numeric(3, 2),
	"recommendation_text" text,
	"nutritional_highlights" text[],
	"cautionary_notes" text[],
	"recommended_for" varchar,
	"ideal_day_time" varchar,
	"seasonality" varchar,
	"was_shown" boolean DEFAULT false,
	"user_clicked" boolean DEFAULT false,
	"user_rated" integer,
	"ai_model_version" varchar,
	"generated_at" timestamp DEFAULT now(),
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "platform_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" timestamp NOT NULL,
	"total_users" integer DEFAULT 0,
	"active_users" integer DEFAULT 0,
	"new_users" integer DEFAULT 0,
	"total_restaurants" integer DEFAULT 0,
	"active_restaurants" integer DEFAULT 0,
	"new_restaurants" integer DEFAULT 0,
	"total_orders" integer DEFAULT 0,
	"total_vouchers_purchased" integer DEFAULT 0,
	"total_revenue" numeric(12, 2) DEFAULT '0.00',
	"total_commission_earned" numeric(12, 2) DEFAULT '0.00',
	"total_points_issued" integer DEFAULT 0,
	"total_points_redeemed" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "platform_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"metric_date" timestamp DEFAULT now(),
	"total_transactions" integer DEFAULT 0,
	"total_transaction_volume" numeric(12, 2) DEFAULT '0.00',
	"total_commission_earned" numeric(10, 2) DEFAULT '0.00',
	"active_restaurants" integer DEFAULT 0,
	"active_customers" integer DEFAULT 0,
	"vouchers_redeemed" integer DEFAULT 0,
	"qr_payments_processed" integer DEFAULT 0,
	"average_transaction_value" numeric(8, 2) DEFAULT '0.00',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "platform_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"setting_key" varchar NOT NULL,
	"setting_value" text NOT NULL,
	"setting_type" text NOT NULL,
	"description" text,
	"updated_by" integer,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "platform_settings_setting_key_unique" UNIQUE("setting_key")
);
--> statement-breakpoint
CREATE TABLE "points_redemptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"restaurant_id" integer NOT NULL,
	"order_id" integer,
	"points_used" integer NOT NULL,
	"cash_value" numeric(10, 2) NOT NULL,
	"exchange_rate" numeric(5, 4) NOT NULL,
	"redemption_date" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "points_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"restaurant_id" integer,
	"order_id" integer,
	"voucher_id" integer,
	"transaction_type" text NOT NULL,
	"points_amount" integer NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "purchased_vouchers" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"package_id" integer NOT NULL,
	"restaurant_id" integer NOT NULL,
	"total_meals" integer NOT NULL,
	"used_meals" integer DEFAULT 0,
	"purchase_price" numeric(10, 2) NOT NULL,
	"discount_received" numeric(10, 2) NOT NULL,
	"purchase_date" timestamp DEFAULT now(),
	"expiry_date" timestamp NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"qr_code" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "qr_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"qr_code_data" text NOT NULL,
	"qr_code_type" text NOT NULL,
	"customer_id" integer,
	"restaurant_id" integer,
	"voucher_id" integer,
	"general_voucher_id" integer,
	"is_active" boolean DEFAULT true,
	"usage_count" integer DEFAULT 0,
	"max_usage" integer DEFAULT 1,
	"expires_at" timestamp,
	"last_used_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "qr_codes_qr_code_data_unique" UNIQUE("qr_code_data")
);
--> statement-breakpoint
CREATE TABLE "recipe_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"recipe_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"content" text NOT NULL,
	"parent_comment_id" integer,
	"likes_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "recipe_likes" (
	"id" serial PRIMARY KEY NOT NULL,
	"recipe_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "recipe_saves" (
	"id" serial PRIMARY KEY NOT NULL,
	"recipe_id" integer NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "recipes" (
	"id" serial PRIMARY KEY NOT NULL,
	"author_id" integer NOT NULL,
	"restaurant_id" integer,
	"title" text NOT NULL,
	"description" text,
	"image_url" text,
	"prep_time_minutes" integer,
	"cook_time_minutes" integer,
	"servings" integer,
	"difficulty" varchar,
	"ingredients" jsonb NOT NULL,
	"instructions" jsonb NOT NULL,
	"cuisine" varchar,
	"category" varchar,
	"dietary_tags" text[],
	"likes_count" integer DEFAULT 0,
	"comments_count" integer DEFAULT 0,
	"saves_count" integer DEFAULT 0,
	"views_count" integer DEFAULT 0,
	"is_published" boolean DEFAULT true,
	"is_featured" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "restaurant_availability" (
	"id" serial PRIMARY KEY NOT NULL,
	"restaurant_id" integer NOT NULL,
	"day_of_week" integer NOT NULL,
	"open_time" varchar(5) NOT NULL,
	"close_time" varchar(5) NOT NULL,
	"max_party_size" integer DEFAULT 8,
	"total_tables" integer DEFAULT 10,
	"accepts_reservations" boolean DEFAULT true,
	"advance_booking_days" integer DEFAULT 30,
	"min_booking_hours" integer DEFAULT 2,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "restaurant_enrollments" (
	"id" serial PRIMARY KEY NOT NULL,
	"restaurant_name" text NOT NULL,
	"owner_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text NOT NULL,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"postal_code" text NOT NULL,
	"cuisine" text NOT NULL,
	"description" text NOT NULL,
	"website" text,
	"business_license" text NOT NULL,
	"vat_number" text,
	"estimated_monthly_orders" text NOT NULL,
	"has_delivery" boolean DEFAULT false,
	"has_pickup" boolean DEFAULT true,
	"operating_hours" text NOT NULL,
	"status" text DEFAULT 'pending',
	"submitted_at" timestamp DEFAULT now(),
	"reviewed_at" timestamp,
	"reviewed_by" integer,
	"review_notes" text,
	"terms_accepted" boolean DEFAULT false,
	"data_processing_consent" boolean DEFAULT false
);
--> statement-breakpoint
CREATE TABLE "restaurant_finances" (
	"id" serial PRIMARY KEY NOT NULL,
	"restaurant_id" integer NOT NULL,
	"month" integer NOT NULL,
	"year" integer NOT NULL,
	"total_voucher_sales" numeric(12, 2) DEFAULT '0.00',
	"total_menu_sales" numeric(12, 2) DEFAULT '0.00',
	"total_points_redemptions" numeric(12, 2) DEFAULT '0.00',
	"platform_commission" numeric(12, 2) DEFAULT '0.00',
	"commission_rate" numeric(5, 4) DEFAULT '0.05' NOT NULL,
	"amount_due" numeric(12, 2) DEFAULT '0.00',
	"amount_paid" numeric(12, 2) DEFAULT '0.00',
	"settlement_status" text DEFAULT 'pending',
	"last_settlement_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "restaurant_financials" (
	"id" serial PRIMARY KEY NOT NULL,
	"restaurant_id" integer NOT NULL,
	"date" varchar NOT NULL,
	"cash_earned" numeric(10, 2) DEFAULT '0.00',
	"points_earned" numeric(10, 2) DEFAULT '0.00',
	"commission_rate" numeric(5, 4) NOT NULL,
	"commission_amount" numeric(10, 2) NOT NULL,
	"net_amount" numeric(10, 2) NOT NULL,
	"payout_status" varchar DEFAULT 'pending',
	"payout_date" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "restaurant_owners" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar NOT NULL,
	"password_hash" varchar NOT NULL,
	"company_name" text NOT NULL,
	"business_registration_number" varchar,
	"tax_id" varchar,
	"company_address" text NOT NULL,
	"company_phone" varchar NOT NULL,
	"company_website" varchar,
	"contact_person_name" text NOT NULL,
	"contact_person_title" text NOT NULL,
	"contact_person_phone" varchar NOT NULL,
	"contact_person_email" varchar NOT NULL,
	"bank_name" varchar,
	"bank_account_number" varchar,
	"bank_routing_number" varchar,
	"bank_account_holder_name" varchar,
	"iban" varchar,
	"swift_code" varchar,
	"bank_address" text,
	"account_type" varchar,
	"is_verified" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "restaurant_owners_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "restaurants" (
	"id" serial PRIMARY KEY NOT NULL,
	"owner_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"cuisine" text NOT NULL,
	"location" text NOT NULL,
	"address" text NOT NULL,
	"phone" text,
	"email" text,
	"website" text,
	"image_url" text,
	"rating" numeric(2, 1) DEFAULT '0.0',
	"review_count" integer DEFAULT 0,
	"google_rating" numeric(2, 1),
	"google_review_count" integer,
	"price_range" text NOT NULL,
	"features" text[],
	"operating_hours" jsonb,
	"offers_delivery" boolean DEFAULT false,
	"offers_takeout" boolean DEFAULT true,
	"dine_in_available" boolean DEFAULT true,
	"delivery_radius" numeric(5, 2),
	"delivery_fee" numeric(10, 2),
	"minimum_delivery_order" numeric(10, 2),
	"dietary_options" text[],
	"allergen_info" text[],
	"health_focused" boolean DEFAULT false,
	"restaurant_code" text,
	"is_approved" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"approved_at" timestamp,
	"priority" integer DEFAULT 3,
	"position" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "restaurants_restaurant_code_unique" UNIQUE("restaurant_code")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "support_analytics" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" timestamp NOT NULL,
	"total_conversations" integer DEFAULT 0,
	"ai_handled_conversations" integer DEFAULT 0,
	"escalated_conversations" integer DEFAULT 0,
	"avg_resolution_time_minutes" integer DEFAULT 0,
	"first_contact_resolution_rate" numeric(5, 2) DEFAULT '0.00',
	"avg_csat_score" numeric(3, 2) DEFAULT '0.00',
	"total_csat_responses" integer DEFAULT 0,
	"deflection_rate" numeric(5, 2) DEFAULT '0.00',
	"avg_ai_confidence" numeric(3, 2) DEFAULT '0.00',
	"top_categories" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "support_conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"title" text,
	"status" text DEFAULT 'active' NOT NULL,
	"channel" text DEFAULT 'chat' NOT NULL,
	"is_handled_by_ai" boolean DEFAULT true,
	"ai_confidence_score" numeric(3, 2),
	"escalated_at" timestamp,
	"escalation_reason" text,
	"assigned_agent_id" integer,
	"last_message_at" timestamp,
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "support_messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer NOT NULL,
	"role" text NOT NULL,
	"content" text NOT NULL,
	"rag_source_ids" text[],
	"ai_model_version" text,
	"attachment_urls" text[],
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "support_tickets" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer,
	"customer_id" integer NOT NULL,
	"ticket_number" varchar(20) NOT NULL,
	"subject" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"priority" text DEFAULT 'medium' NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"assigned_agent_id" integer,
	"assigned_at" timestamp,
	"resolution" text,
	"resolved_by" integer,
	"resolved_at" timestamp,
	"csat_rating" integer,
	"csat_feedback" text,
	"support_bundle" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "support_tickets_ticket_number_unique" UNIQUE("ticket_number")
);
--> statement-breakpoint
CREATE TABLE "table_reservations" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer,
	"customer_name" varchar(255) NOT NULL,
	"customer_phone" varchar(20) NOT NULL,
	"customer_email" varchar(255) NOT NULL,
	"restaurant_id" integer NOT NULL,
	"reservation_date" timestamp NOT NULL,
	"party_size" integer NOT NULL,
	"special_requests" text,
	"voucher_package_id" integer,
	"is_voucher_reservation" boolean DEFAULT false,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"restaurant_notes" text,
	"confirmed_by" integer,
	"confirmed_at" timestamp,
	"customer_notified" boolean DEFAULT false,
	"notification_sent_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "transaction_commissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"transaction_id" varchar NOT NULL,
	"restaurant_id" integer,
	"customer_id" integer,
	"transaction_amount" numeric(10, 2) NOT NULL,
	"commission_rate" numeric(5, 2) NOT NULL,
	"commission_amount" numeric(10, 2) NOT NULL,
	"payment_method" varchar NOT NULL,
	"transaction_type" varchar NOT NULL,
	"status" varchar DEFAULT 'pending',
	"processed_at" timestamp DEFAULT now(),
	"settled_at" timestamp,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "user_addresses" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"label" varchar NOT NULL,
	"address" text NOT NULL,
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"instructions" text,
	"is_default" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_dietary_profiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"age" integer,
	"height" integer,
	"weight" numeric(5, 2),
	"gender" varchar,
	"activity_level" varchar,
	"health_goal" varchar,
	"target_weight" numeric(5, 2),
	"dietary_preferences" text[],
	"allergies" text[],
	"food_intolerances" text[],
	"disliked_ingredients" text[],
	"preferred_cuisines" text[],
	"health_conditions" text[],
	"medications" text[],
	"preferred_meal_timing" varchar,
	"calorie_target" integer,
	"protein_target" integer,
	"carb_target" integer,
	"fat_target" integer,
	"budget_range" varchar,
	"dining_frequency" varchar,
	"social_dining" boolean DEFAULT false,
	"last_recommendation_update" timestamp,
	"recommendation_accuracy" numeric(3, 2) DEFAULT '0.00',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_meal_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar NOT NULL,
	"restaurant_id" integer,
	"menu_item_id" integer,
	"meal_type" varchar,
	"meal_date" timestamp NOT NULL,
	"portion_size" varchar,
	"satisfaction_rating" integer,
	"taste_rating" integer,
	"healthiness_rating" integer,
	"value_rating" integer,
	"notes" text,
	"would_order_again" boolean,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar PRIMARY KEY NOT NULL,
	"email" varchar,
	"first_name" varchar,
	"last_name" varchar,
	"profile_image_url" varchar,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "voucher_packages" (
	"id" serial PRIMARY KEY NOT NULL,
	"restaurant_id" integer NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"meal_count" integer NOT NULL,
	"price_per_meal" numeric(10, 2) NOT NULL,
	"discount_percentage" numeric(5, 2) NOT NULL,
	"validity_months" integer DEFAULT 12,
	"validity_start_date" timestamp,
	"validity_end_date" timestamp,
	"validity_type" text DEFAULT 'months',
	"image_url" text,
	"is_active" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "voucher_redemptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"voucher_id" integer NOT NULL,
	"restaurant_id" integer NOT NULL,
	"customer_id" integer NOT NULL,
	"redemption_date" timestamp DEFAULT now(),
	"meal_value" numeric(10, 2) NOT NULL,
	"discount_applied" numeric(10, 2) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "voucher_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"meal_count_options" integer[] NOT NULL,
	"discount_ranges" text[] NOT NULL,
	"validity_options" integer[] NOT NULL,
	"image_url" text,
	"category" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "wallet_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"transaction_type" text NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"description" text NOT NULL,
	"balance_before" numeric(10, 2) NOT NULL,
	"balance_after" numeric(10, 2) NOT NULL,
	"restaurant_id" integer,
	"order_id" integer,
	"payment_transaction_id" integer,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_admin_id_eatoff_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."eatoff_admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_admin_id_eatoff_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."eatoff_admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_targets" ADD CONSTRAINT "campaign_targets_campaign_id_marketing_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."marketing_campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_targets" ADD CONSTRAINT "campaign_targets_user_id_customers_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cashback_groups" ADD CONSTRAINT "cashback_groups_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cashback_transactions" ADD CONSTRAINT "cashback_transactions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cashback_transactions" ADD CONSTRAINT "cashback_transactions_group_id_cashback_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."cashback_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cashback_transactions" ADD CONSTRAINT "cashback_transactions_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cashback_transactions" ADD CONSTRAINT "cashback_transactions_source_order_id_orders_id_fk" FOREIGN KEY ("source_order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_payouts" ADD CONSTRAINT "commission_payouts_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "commission_settings" ADD CONSTRAINT "commission_settings_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_credit_account_id_customer_credit_account_id_fk" FOREIGN KEY ("credit_account_id") REFERENCES "public"."customer_credit_account"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credit_transactions" ADD CONSTRAINT "credit_transactions_voucher_id_eatoff_vouchers_id_fk" FOREIGN KEY ("voucher_id") REFERENCES "public"."eatoff_vouchers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_cashback_balance" ADD CONSTRAINT "customer_cashback_balance_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_cashback_enrollments" ADD CONSTRAINT "customer_cashback_enrollments_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_cashback_enrollments" ADD CONSTRAINT "customer_cashback_enrollments_group_id_cashback_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."cashback_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_credit_account" ADD CONSTRAINT "customer_credit_account_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_credit_account" ADD CONSTRAINT "customer_credit_account_credit_type_id_credit_types_id_fk" FOREIGN KEY ("credit_type_id") REFERENCES "public"."credit_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_favorites" ADD CONSTRAINT "customer_favorites_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_favorites" ADD CONSTRAINT "customer_favorites_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_general_vouchers" ADD CONSTRAINT "customer_general_vouchers_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_general_vouchers" ADD CONSTRAINT "customer_general_vouchers_general_voucher_id_general_vouchers_id_fk" FOREIGN KEY ("general_voucher_id") REFERENCES "public"."general_vouchers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_loyalty_enrollments" ADD CONSTRAINT "customer_loyalty_enrollments_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_loyalty_enrollments" ADD CONSTRAINT "customer_loyalty_enrollments_group_id_loyalty_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."loyalty_groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_loyalty_enrollments" ADD CONSTRAINT "customer_loyalty_enrollments_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_restaurant_cashback" ADD CONSTRAINT "customer_restaurant_cashback_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_restaurant_cashback" ADD CONSTRAINT "customer_restaurant_cashback_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_reviews" ADD CONSTRAINT "customer_reviews_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_reviews" ADD CONSTRAINT "customer_reviews_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_wallets" ADD CONSTRAINT "customer_wallets_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deferred_payments" ADD CONSTRAINT "deferred_payments_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deferred_payments" ADD CONSTRAINT "deferred_payments_voucher_id_eatoff_vouchers_id_fk" FOREIGN KEY ("voucher_id") REFERENCES "public"."eatoff_vouchers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_base" ADD CONSTRAINT "knowledge_base_created_by_eatoff_admins_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."eatoff_admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "knowledge_base" ADD CONSTRAINT "knowledge_base_last_updated_by_eatoff_admins_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."eatoff_admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyal_customers" ADD CONSTRAINT "loyal_customers_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyal_customers" ADD CONSTRAINT "loyal_customers_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyal_customers" ADD CONSTRAINT "loyal_customers_category_id_loyalty_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."loyalty_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_categories" ADD CONSTRAINT "loyalty_categories_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_groups" ADD CONSTRAINT "loyalty_groups_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketing_campaigns" ADD CONSTRAINT "marketing_campaigns_created_by_eatoff_admins_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."eatoff_admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "menu_items" ADD CONSTRAINT "menu_items_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_requests" ADD CONSTRAINT "payment_requests_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_requests" ADD CONSTRAINT "payment_requests_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_voucher_id_purchased_vouchers_id_fk" FOREIGN KEY ("voucher_id") REFERENCES "public"."purchased_vouchers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_transactions" ADD CONSTRAINT "payment_transactions_general_voucher_id_customer_general_vouchers_id_fk" FOREIGN KEY ("general_voucher_id") REFERENCES "public"."customer_general_vouchers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "platform_settings" ADD CONSTRAINT "platform_settings_updated_by_admin_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."admin_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_redemptions" ADD CONSTRAINT "points_redemptions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_redemptions" ADD CONSTRAINT "points_redemptions_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_redemptions" ADD CONSTRAINT "points_redemptions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_transactions" ADD CONSTRAINT "points_transactions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_transactions" ADD CONSTRAINT "points_transactions_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_transactions" ADD CONSTRAINT "points_transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "points_transactions" ADD CONSTRAINT "points_transactions_voucher_id_purchased_vouchers_id_fk" FOREIGN KEY ("voucher_id") REFERENCES "public"."purchased_vouchers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchased_vouchers" ADD CONSTRAINT "purchased_vouchers_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchased_vouchers" ADD CONSTRAINT "purchased_vouchers_package_id_voucher_packages_id_fk" FOREIGN KEY ("package_id") REFERENCES "public"."voucher_packages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchased_vouchers" ADD CONSTRAINT "purchased_vouchers_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_voucher_id_purchased_vouchers_id_fk" FOREIGN KEY ("voucher_id") REFERENCES "public"."purchased_vouchers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qr_codes" ADD CONSTRAINT "qr_codes_general_voucher_id_customer_general_vouchers_id_fk" FOREIGN KEY ("general_voucher_id") REFERENCES "public"."customer_general_vouchers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_comments" ADD CONSTRAINT "recipe_comments_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_comments" ADD CONSTRAINT "recipe_comments_user_id_customers_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_likes" ADD CONSTRAINT "recipe_likes_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_likes" ADD CONSTRAINT "recipe_likes_user_id_customers_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_saves" ADD CONSTRAINT "recipe_saves_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipe_saves" ADD CONSTRAINT "recipe_saves_user_id_customers_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_author_id_customers_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recipes" ADD CONSTRAINT "recipes_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_availability" ADD CONSTRAINT "restaurant_availability_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_finances" ADD CONSTRAINT "restaurant_finances_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurant_financials" ADD CONSTRAINT "restaurant_financials_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "restaurants" ADD CONSTRAINT "restaurants_owner_id_restaurant_owners_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."restaurant_owners"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_conversations" ADD CONSTRAINT "support_conversations_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_conversations" ADD CONSTRAINT "support_conversations_assigned_agent_id_eatoff_admins_id_fk" FOREIGN KEY ("assigned_agent_id") REFERENCES "public"."eatoff_admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_messages" ADD CONSTRAINT "support_messages_conversation_id_support_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."support_conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_conversation_id_support_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."support_conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_assigned_agent_id_eatoff_admins_id_fk" FOREIGN KEY ("assigned_agent_id") REFERENCES "public"."eatoff_admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_resolved_by_eatoff_admins_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."eatoff_admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table_reservations" ADD CONSTRAINT "table_reservations_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table_reservations" ADD CONSTRAINT "table_reservations_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "table_reservations" ADD CONSTRAINT "table_reservations_voucher_package_id_voucher_packages_id_fk" FOREIGN KEY ("voucher_package_id") REFERENCES "public"."voucher_packages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_commissions" ADD CONSTRAINT "transaction_commissions_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction_commissions" ADD CONSTRAINT "transaction_commissions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_meal_history" ADD CONSTRAINT "user_meal_history_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_meal_history" ADD CONSTRAINT "user_meal_history_menu_item_id_menu_items_id_fk" FOREIGN KEY ("menu_item_id") REFERENCES "public"."menu_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voucher_packages" ADD CONSTRAINT "voucher_packages_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voucher_redemptions" ADD CONSTRAINT "voucher_redemptions_voucher_id_purchased_vouchers_id_fk" FOREIGN KEY ("voucher_id") REFERENCES "public"."purchased_vouchers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voucher_redemptions" ADD CONSTRAINT "voucher_redemptions_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "voucher_redemptions" ADD CONSTRAINT "voucher_redemptions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_restaurant_id_restaurants_id_fk" FOREIGN KEY ("restaurant_id") REFERENCES "public"."restaurants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_payment_transaction_id_payment_transactions_id_fk" FOREIGN KEY ("payment_transaction_id") REFERENCES "public"."payment_transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");