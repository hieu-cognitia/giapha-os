# PocketBase Schema — Gia Phả OS

This document describes the PocketBase collections required to run Gia Phả OS.
Create each collection via the PocketBase Admin UI at `http://127.0.0.1:8090/_/`.

---

## Prerequisites

1. Download PocketBase from https://pocketbase.io/docs/
2. Start it: `./pocketbase serve`
3. Open the Admin UI: `http://127.0.0.1:8090/_/`
4. Create your **superadmin** account on first launch

---

## Collections

### 1. `users` (Auth collection — built-in, extend it)

PocketBase ships with a built-in `users` auth collection. Open it and add:

| Field name  | Type    | Required | Default  | Notes                    |
|-------------|---------|----------|----------|--------------------------|
| `role`      | Select  | yes      | `member` | Options: `admin`, `member` |
| `is_active` | Bool    | yes      | `false`  |                          |

**API Rules:**

| Rule        | Value                                             |
|-------------|---------------------------------------------------|
| listRule    | `@request.auth.role = "admin" \|\| @request.auth.id = id` |
| viewRule    | `@request.auth.role = "admin" \|\| @request.auth.id = id` |
| createRule  | *(empty — self-registration allowed via auth API)* |
| updateRule  | `@request.auth.role = "admin"`                    |
| deleteRule  | `@request.auth.role = "admin"`                    |

---

### 2. `persons`

| Field name      | Type    | Required | Notes                   |
|-----------------|---------|----------|-------------------------|
| `full_name`     | Text    | yes      |                         |
| `gender`        | Select  | yes      | Options: `male`, `female`, `other` |
| `birth_year`    | Number  | no       |                         |
| `birth_month`   | Number  | no       |                         |
| `birth_day`     | Number  | no       |                         |
| `death_year`    | Number  | no       |                         |
| `death_month`   | Number  | no       |                         |
| `death_day`     | Number  | no       |                         |
| `is_deceased`   | Bool    | yes      | Default: `false`        |
| `is_in_law`     | Bool    | yes      | Default: `false`        |
| `birth_order`   | Number  | no       |                         |
| `generation`    | Number  | no       |                         |
| `avatar_url`    | URL     | no       | Stored URL from `avatars` collection |
| `note`          | Text    | no       | Long text               |

**API Rules:**

| Rule        | Value                           |
|-------------|---------------------------------|
| listRule    | `@request.auth.id != ""`        |
| viewRule    | `@request.auth.id != ""`        |
| createRule  | `@request.auth.role = "admin"`  |
| updateRule  | `@request.auth.role = "admin"`  |
| deleteRule  | `@request.auth.role = "admin"`  |

---

### 3. `relationships`

| Field name | Type     | Required | Notes                                           |
|------------|----------|----------|-------------------------------------------------|
| `type`     | Select   | yes      | Options: `marriage`, `biological_child`, `adopted_child` |
| `person_a` | Relation | yes      | Points to `persons`. For parent-child: person_a = parent |
| `person_b` | Relation | yes      | Points to `persons`. For parent-child: person_b = child  |
| `note`     | Text     | no       |                                                 |

**API Rules:**

| Rule        | Value                           |
|-------------|---------------------------------|
| listRule    | `@request.auth.id != ""`        |
| viewRule    | `@request.auth.id != ""`        |
| createRule  | `@request.auth.role = "admin"`  |
| updateRule  | `@request.auth.role = "admin"`  |
| deleteRule  | `@request.auth.role = "admin"`  |

---

### 4. `person_details_private`

Sensitive data accessible only to admins.

| Field name           | Type     | Required | Notes                         |
|----------------------|----------|----------|-------------------------------|
| `person_id`          | Relation | yes      | Points to `persons` (unique)  |
| `phone_number`       | Text     | no       |                               |
| `occupation`         | Text     | no       |                               |
| `current_residence`  | Text     | no       |                               |

**API Rules:**

| Rule        | Value                           |
|-------------|---------------------------------|
| listRule    | `@request.auth.role = "admin"`  |
| viewRule    | `@request.auth.role = "admin"`  |
| createRule  | `@request.auth.role = "admin"`  |
| updateRule  | `@request.auth.role = "admin"`  |
| deleteRule  | `@request.auth.role = "admin"`  |

---

### 5. `avatars`

Stores uploaded avatar images (replaces Supabase Storage).

| Field name | Type | Required | Notes                    |
|------------|------|----------|--------------------------|
| `file`     | File | yes      | Single file, images only |

**API Rules:**

| Rule        | Value                          |
|-------------|--------------------------------|
| listRule    | *(null — public read)*         |
| viewRule    | *(null — public read)*         |
| createRule  | `@request.auth.id != ""`       |
| updateRule  | `@request.auth.role = "admin"` |
| deleteRule  | `@request.auth.id != ""`       |

---

## Environment Variables

After setting up PocketBase and creating the collections, configure your `.env.local`:

```env
NEXT_PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090
POCKETBASE_SUPERADMIN_EMAIL=your_superadmin_email
POCKETBASE_SUPERADMIN_PASSWORD=your_superadmin_password
```

---

## First User

The first user who registers via the `/login` page will automatically become an **admin** with `is_active = true`. All subsequent registrations default to `role = member` and `is_active = false` until an admin activates them via the **Users** panel.
