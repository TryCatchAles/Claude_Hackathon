SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict vax0aADcYFwgj4iYKjppxnHNRcFKkcAZ7dphhoIkVuvCpMSO1wMKGYlfPbSoN4W

-- Dumped from database version 15.8
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") VALUES
	('00000000-0000-0000-0000-000000000000', '31fb8fb4-c275-4ab6-a139-3d22cddb2b17', '{"action":"user_signedup","actor_id":"3fbe5f52-40d8-402e-8458-44334c13e822","actor_name":"Ales laiche","actor_username":"alesmax642@gmail.com","actor_via_sso":false,"log_type":"team","traits":{"provider":"google"}}', '2026-04-03 22:42:12.434561+00', ''),
	('00000000-0000-0000-0000-000000000000', '6a7d5b05-a0a9-4a2b-a319-035a2944d896', '{"action":"login","actor_id":"3fbe5f52-40d8-402e-8458-44334c13e822","actor_name":"Ales laiche","actor_username":"alesmax642@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2026-04-03 22:42:13.56946+00', ''),
	('00000000-0000-0000-0000-000000000000', '30e999b9-2717-4760-a376-44d1181f78ea', '{"action":"login","actor_id":"3fbe5f52-40d8-402e-8458-44334c13e822","actor_name":"Ales laiche","actor_username":"alesmax642@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2026-04-03 23:05:34.771813+00', ''),
	('00000000-0000-0000-0000-000000000000', 'a942c5aa-a5bd-467b-a671-1f3bc51536b4', '{"action":"login","actor_id":"3fbe5f52-40d8-402e-8458-44334c13e822","actor_name":"Ales laiche","actor_username":"alesmax642@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2026-04-03 23:05:36.203794+00', ''),
	('00000000-0000-0000-0000-000000000000', '281fbd7c-cab8-4787-a1b6-a550c2fa016d', '{"action":"token_refreshed","actor_id":"3fbe5f52-40d8-402e-8458-44334c13e822","actor_name":"Ales laiche","actor_username":"alesmax642@gmail.com","actor_via_sso":false,"log_type":"token"}', '2026-04-04 15:02:01.919703+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ad434b27-a6f8-4182-8d94-8a781c73fd2f', '{"action":"token_revoked","actor_id":"3fbe5f52-40d8-402e-8458-44334c13e822","actor_name":"Ales laiche","actor_username":"alesmax642@gmail.com","actor_via_sso":false,"log_type":"token"}', '2026-04-04 15:02:01.923589+00', ''),
	('00000000-0000-0000-0000-000000000000', '3eda2cba-abd7-4363-af0d-a9a55d8a04b7', '{"action":"token_refreshed","actor_id":"3fbe5f52-40d8-402e-8458-44334c13e822","actor_name":"Ales laiche","actor_username":"alesmax642@gmail.com","actor_via_sso":false,"log_type":"token"}', '2026-04-04 15:02:02.08352+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e2df5ded-c6bc-4949-b097-094f92925263', '{"action":"token_refreshed","actor_id":"3fbe5f52-40d8-402e-8458-44334c13e822","actor_name":"Ales laiche","actor_username":"alesmax642@gmail.com","actor_via_sso":false,"log_type":"token"}', '2026-04-04 15:03:04.130789+00', ''),
	('00000000-0000-0000-0000-000000000000', 'ef8a3a42-d7e2-4290-96d7-4734dd1d5da7', '{"action":"token_refreshed","actor_id":"3fbe5f52-40d8-402e-8458-44334c13e822","actor_name":"Ales laiche","actor_username":"alesmax642@gmail.com","actor_via_sso":false,"log_type":"token"}', '2026-04-04 15:04:47.908708+00', ''),
	('00000000-0000-0000-0000-000000000000', '4a56ecf9-9d4b-446d-a37a-48289874e1ef', '{"action":"token_refreshed","actor_id":"3fbe5f52-40d8-402e-8458-44334c13e822","actor_name":"Ales laiche","actor_username":"alesmax642@gmail.com","actor_via_sso":false,"log_type":"token"}', '2026-04-04 15:04:49.490859+00', ''),
	('00000000-0000-0000-0000-000000000000', '4e3d1178-498a-4311-a4bd-a78e2c33477b', '{"action":"token_refreshed","actor_id":"3fbe5f52-40d8-402e-8458-44334c13e822","actor_name":"Ales laiche","actor_username":"alesmax642@gmail.com","actor_via_sso":false,"log_type":"token"}', '2026-04-04 15:04:49.693155+00', ''),
	('00000000-0000-0000-0000-000000000000', '90dc2504-6dcf-4879-bd2a-7cc7eae52efe', '{"action":"token_refreshed","actor_id":"3fbe5f52-40d8-402e-8458-44334c13e822","actor_name":"Ales laiche","actor_username":"alesmax642@gmail.com","actor_via_sso":false,"log_type":"token"}', '2026-04-04 15:04:55.99002+00', ''),
	('00000000-0000-0000-0000-000000000000', '56151f43-1b8e-4168-b008-df30470e6232', '{"action":"logout","actor_id":"3fbe5f52-40d8-402e-8458-44334c13e822","actor_name":"Ales laiche","actor_username":"alesmax642@gmail.com","actor_via_sso":false,"log_type":"account"}', '2026-04-04 15:04:56.385259+00', ''),
	('00000000-0000-0000-0000-000000000000', 'e02df882-737f-4953-a660-5b14bf3a3054', '{"action":"login","actor_id":"3fbe5f52-40d8-402e-8458-44334c13e822","actor_name":"Ales laiche","actor_username":"alesmax642@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider":"google"}}', '2026-04-04 15:05:11.81036+00', ''),
	('00000000-0000-0000-0000-000000000000', '2f8bef9c-be27-4832-8b34-0682e63c1812', '{"action":"login","actor_id":"3fbe5f52-40d8-402e-8458-44334c13e822","actor_name":"Ales laiche","actor_username":"alesmax642@gmail.com","actor_via_sso":false,"log_type":"account","traits":{"provider_type":"google"}}', '2026-04-04 15:05:13.114405+00', '');


--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."flow_state" ("id", "user_id", "auth_code", "code_challenge_method", "code_challenge", "provider_type", "provider_access_token", "provider_refresh_token", "created_at", "updated_at", "authentication_method", "auth_code_issued_at", "invite_token", "referrer", "oauth_client_state_id", "linking_target_id", "email_optional") VALUES
	('69675bf8-ec16-4aa3-80f2-44bb9022b419', NULL, 'fa8c512d-3e2a-422c-a358-a4f6c279ddc6', 's256', 'FOsAape9LC33BpAV4EzSQcdhCGvNh8zftR43yZ-ZmSQ', 'google', '', '', '2026-04-03 22:40:26.230514+00', '2026-04-03 22:40:26.230514+00', 'oauth', NULL, NULL, 'http://localhost:3000/auth/callback', NULL, NULL, false);


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', '3fbe5f52-40d8-402e-8458-44334c13e822', 'authenticated', 'authenticated', 'alesmax642@gmail.com', NULL, '2026-04-03 22:42:12.438011+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-04-04 15:05:13.116718+00', '{"provider": "google", "providers": ["google"]}', '{"iss": "https://accounts.google.com", "sub": "110466139408937985389", "name": "Ales laiche", "email": "alesmax642@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocIwhsYXQ2NTBI3Y6NOO1KabjLn28fEPhpDjqCOPwaxNo10BzbRu=s96-c", "full_name": "Ales laiche", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocIwhsYXQ2NTBI3Y6NOO1KabjLn28fEPhpDjqCOPwaxNo10BzbRu=s96-c", "provider_id": "110466139408937985389", "email_verified": true, "phone_verified": false}', NULL, '2026-04-03 22:42:12.410768+00', '2026-04-04 15:05:13.122898+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('110466139408937985389', '3fbe5f52-40d8-402e-8458-44334c13e822', '{"iss": "https://accounts.google.com", "sub": "110466139408937985389", "name": "Ales laiche", "email": "alesmax642@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocIwhsYXQ2NTBI3Y6NOO1KabjLn28fEPhpDjqCOPwaxNo10BzbRu=s96-c", "full_name": "Ales laiche", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocIwhsYXQ2NTBI3Y6NOO1KabjLn28fEPhpDjqCOPwaxNo10BzbRu=s96-c", "provider_id": "110466139408937985389", "email_verified": true, "phone_verified": false}', 'google', '2026-04-03 22:42:12.42734+00', '2026-04-03 22:42:12.427396+00', '2026-04-04 15:05:11.798793+00', '3cc894ef-047c-4fb1-9f80-3f40875b4a75');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag", "oauth_client_id", "refresh_token_hmac_key", "refresh_token_counter", "scopes") VALUES
	('94166542-d956-46c8-b7e0-d33fd94e0d67', '3fbe5f52-40d8-402e-8458-44334c13e822', '2026-04-04 15:05:13.11685+00', '2026-04-04 15:05:13.11685+00', NULL, 'aal1', NULL, NULL, 'node', '172.19.0.1', NULL, NULL, NULL, NULL, NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('94166542-d956-46c8-b7e0-d33fd94e0d67', '2026-04-04 15:05:13.123906+00', '2026-04-04 15:05:13.123906+00', 'oauth', '4aa8b76b-ef33-46eb-9a52-9b946cd7de39');


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 4, '5lpk52rrly4q', '3fbe5f52-40d8-402e-8458-44334c13e822', false, '2026-04-04 15:05:13.120673+00', '2026-04-04 15:05:13.120673+00', NULL, '94166542-d956-46c8-b7e0-d33fd94e0d67');


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."profiles" ("id", "display_name", "bio", "school", "degree", "hashtags", "email_verified", "phone_verified", "edu_email", "status", "credits", "created_at", "updated_at") VALUES
	('3fbe5f52-40d8-402e-8458-44334c13e822', 'Ales laiche', NULL, NULL, NULL, '{}', false, false, false, 'active', 3, '2026-04-03 22:42:12.39571+00', '2026-04-03 22:42:14.180696+00');


--
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: ratings; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: credits; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: disputes; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: flags; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: skills; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: iceberg_namespaces; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: iceberg_tables; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: hooks; Type: TABLE DATA; Schema: supabase_functions; Owner: supabase_functions_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 4, true);


--
-- Name: hooks_id_seq; Type: SEQUENCE SET; Schema: supabase_functions; Owner: supabase_functions_admin
--

SELECT pg_catalog.setval('"supabase_functions"."hooks_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

-- \unrestrict vax0aADcYFwgj4iYKjppxnHNRcFKkcAZ7dphhoIkVuvCpMSO1wMKGYlfPbSoN4W

RESET ALL;
