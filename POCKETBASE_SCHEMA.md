# PocketBase Schema Specification - SLP Map Overlay

This document specifies the collections, fields, and API rules required for the new PocketBase server.

## Summary of Collections
| Collection Name | Type | Description |
| :--- | :--- | :--- |
| `users` | Auth | Default PocketBase auth collection |
| `map_groups` | Base | Groups for sharing pins and routes |
| `map_group_members` | Base | Membership relation between users and groups |
| `map_custom_pins` | Base | User-created custom markers |
| `map_routes` | Base | User-created custom navigation routes |
| `public_map_routes` | Base | Routes made public for all users |
| `user_map_stats` | Base | Collection statistics (ores, plants, etc.) per user/day |
| `map_notification_settings` | Base | User preferences for alerts and sounds |
| `map_respawns` | Base | Tracking resource respawn times |
| `map_feedbacks` | Base | User reports for new points or bugs |

---

## 1. `users` (Auth)
Default fields: `email`, `password`, `username`, `name`, `avatar`.

---

## 2. `map_groups` (Base)
| Field | Type | Rules |
| :--- | :--- | :--- |
| `name` | Text | Required |
| `invite_code` | Text | Required, Unique (e.g., 6 chars uppercase) |
| `owner` | Relation | `users`, Required |

**API Rules:**
- List/View: `@request.auth.id != ""` (Any logged-in user can search)
- Create: `@request.auth.id != ""`
- Update: `owner = @request.auth.id`
- Delete: `owner = @request.auth.id`

---

## 3. `map_group_members` (Base)
| Field | Type | Rules |
| :--- | :--- | :--- |
| `group` | Relation | `map_groups`, Required, Cascade Delete |
| `user` | Relation | `users`, Required |
| `role` | Select | `admin`, `member` |

**API Rules:**
- List/View: `@request.auth.id = user || @request.auth.id = group.owner`
- Create: `@request.auth.id != ""` (Joining via invite)
- Update: `group.owner = @request.auth.id`
- Delete: `@request.auth.id = user || group.owner = @request.auth.id`

---

## 4. `map_custom_pins` (Base)
| Field | Type | Rules |
| :--- | :--- | :--- |
| `owner` | Relation | `users`, Required |
| `name` | Text | Required |
| `description` | Text | Optional |
| `color` | Text | Hex code |
| `iconId` | Text | Internal icon identifier |
| `tags` | Json | Array of strings |
| `x` | Number | Map Coordinate |
| `y` | Number | Map Coordinate |
| `imageUrl` | Text | Optional |
| `isPlaced` | Bool | |
| `isHidden` | Bool | |
| `checked` | Bool | |

**API Rules:**
- List/View: `owner = @request.auth.id` (Private pins)
- Create: `owner = @request.auth.id`
- Update: `owner = @request.auth.id`
- Delete: `owner = @request.auth.id`

---

## 5. `map_routes` (Base)
| Field | Type | Rules |
| :--- | :--- | :--- |
| `owner` | Relation | `users`, Required |
| `name` | Text | Required |
| `description` | Text | Optional |
| `color` | Text | Hex code |
| `route` | Json | Full route object (checkpoints, customPins) |
| `isPublic` | Bool | |
| `isHidden` | Bool | |

**API Rules:**
- List/View: `owner = @request.auth.id`
- Create: `owner = @request.auth.id`
- Update: `owner = @request.auth.id`
- Delete: `owner = @request.auth.id`

---

## 6. `public_map_routes` (Base)
| Field | Type | Rules |
| :--- | :--- | :--- |
| `owner` | Relation | `users`, Required |
| `name` | Text | Required |
| `description` | Text | Optional |
| `color` | Text | Hex code |
| `route` | Json | Full route object |
| `publicSlug` | Text | Optional, Unique |

**API Rules:**
- List/View: `""` (Publicly accessible)
- Create: `@request.auth.id != ""`
- Update: `owner = @request.auth.id`
- Delete: `owner = @request.auth.id`

---

## 7. `user_map_stats` (Base)
| Field | Type | Rules |
| :--- | :--- | :--- |
| `user` | Relation | `users`, Required |
| `date` | Text | Format `YYYY-MM-DD` |
| `ore_count` | Json | Map of `oreId -> count` |
| `mushroom_count` | Json | Map of `mushroomId -> count` |
| `plant_count` | Json | Map of `plantId -> count` |
| `stick_count` | Number | Total sticks |

**API Rules:**
- List/View: `user = @request.auth.id`
- Create: `user = @request.auth.id`
- Update: `user = @request.auth.id`
- Delete: `user = @request.auth.id`

---

## 8. `map_notification_settings` (Base)
| Field | Type | Rules |
| :--- | :--- | :--- |
| `owner` | Relation | `users`, Required, Unique |
| `soundEnabled` | Bool | |
| `soundVolume` | Number | |
| `soundType` | Text | |
| `pushEnabled` | Bool | |
| `globalAlertsEnabled`| Bool | |
| `leadTime` | Number | |
| `enabledTypes` | Json | Map of `type -> bool` |
| `rememberLastSubtype`| Bool | |
| `showReadyAlerts` | Bool | |
| `hideUnmarkedResources`| Bool | |
| `lastSelectedSubTypes`| Json | Map of `type -> iconId` |

**API Rules:**
- List/View: `owner = @request.auth.id`
- Create: `owner = @request.auth.id`
- Update: `owner = @request.auth.id`
- Delete: `owner = @request.auth.id`

---

## 9. `map_respawns` (Base)
| Field | Type | Rules |
| :--- | :--- | :--- |
| `point_id` | Text | Required, Unique per group/user |
| `respawn_at` | DateTime | Required |
| `group` | Relation | `map_groups`, Optional |
| `owner` | Relation | `users`, Optional |

**API Rules:**
- List/View: `owner = @request.auth.id || group.members.user ?= @request.auth.id`
- Create: `@request.auth.id != ""`
- Update: `owner = @request.auth.id || group.members.user ?= @request.auth.id`
- Delete: `owner = @request.auth.id || group.members.user ?= @request.auth.id`

---

## 10. `map_feedbacks` (Base)
| Field | Type | Rules |
| :--- | :--- | :--- |
| `user` | Relation | `users`, Optional |
| `type` | Select | `new_point`, `update`, `bug` |
| `x` | Number | |
| `y` | Number | |
| `point_id` | Text | |
| `marker_type` | Text | |
| `image` | File | Optional |
| `observation` | Text | |
| `status` | Select | `pending`, `approved`, `rejected`, `implemented` |

**API Rules:**
- List/View: `user = @request.auth.id` (User sees their own)
- Create: `@request.auth.id != ""`
- Update: `status = "pending" && user = @request.auth.id` (Can only edit if pending)
- Delete: `user = @request.auth.id`
