# Hybrid Duplicate Pothole Detection Engine

## Overview

RoadGuard AI implements a multi-tier, lightweight **Hybrid Duplicate Road Defect Detection Engine** that fuses:
1. **GPS Geospatial Proximity** (Haversine spatial candidate gating).
2. **64-bit Discrete Cosine Transform (DCT) Perceptual Image Hashing (pHash)** (Identical & near-identical photo detection).
3. **OpenCV ORB Feature Matching** (Oriented FAST corners + Rotated BRIEF binary descriptors with Lowe's ratio test and RANSAC homography estimation).

The system operates natively without external pretrained AI weights (such as DINOv2) or external web services.

---

## 1. End-to-End Workflow

```
                             Citizen Submits Report (Photo + GPS)
                                             │
                                             ▼
                                YOLOv11 Road Damage Scan
                               (Bounding boxes, PCI, defect count)
                                             │
                                             ▼
                                  Spatial Proximity Gating
                         (Query issues within radius ≤ 50m; NO full DB scan)
                                             │
                      ┌──────────────────────┴──────────────────────┐
                      ▼                                             ▼
             No nearby candidates                         Nearby candidates found
                      │                                             │
                      ▼                                             ▼
                 [NEW ISSUE]                                Visual Comparisons:
             (Independent Ticket)                      • 64-bit DCT pHash Hamming
                                                       • 1000-point ORB + RANSAC
                                                                    │
                                                                    ▼
                                                        Multi-Tier Evidence Rules
                                                                    │
                    ┌───────────────────────────────┬───────────────┴───────────────────────────────┐
                    ▼                               ▼                                               ▼
         [CONFIRMED DUPLICATE]               [NEEDS REVIEW]                                    [NEW ISSUE]
       • Exact photo re-upload             • Perceptual resemblance                         • Distinct road texture
       • ORB homography inliers ≥ 20       • 10 ≤ ORB inliers < 20                          • No homography, inliers < 10
       • Linked to Canonical Issue         • Proximity (<15m) + Category                    • Even if nearby (e.g. 5m away!)
       • Citizen submission preserved      • Independent ticket                             • Independent ticket
                                           • Queued for Admin Review                        • Safe to dispatch crew
```

---

## 2. Multi-Tier Decision Matrix

Unlike Bayesian approximations that treat heuristic match scores as probabilities, RoadGuard AI utilizes a **principled rule-based evidence matrix**:

| Tier | Verdict | Triggering Conditions | System Action |
| :--- | :--- | :--- | :--- |
| **Tier 1: Confirmed** | `CONFIRMED_DUPLICATE` | • $d_{\text{gps}} \le 50\text{m}$ AND $D_H \le 4$ (Exact photo upload)<br>• **OR** $d_{\text{gps}} \le 50\text{m}$ AND $I_{\text{ransac}} \ge 20$ AND $R_{\text{inlier}} \ge 0.35$ (Confirmed viewpoint geometry) | • Linked to `canonical_issue_id`<br>• `is_duplicate = True`<br>• `duplicate_review_status = "AUTOMATICALLY_LINKED"`<br>• Original citizen submission **fully preserved** |
| **Tier 2: Uncertain** | `NEEDS_REVIEW` | • $d_{\text{gps}} \le 50\text{m}$ AND $5 \le D_H \le 10$ (Perceptual resemblance)<br>• **OR** $d_{\text{gps}} \le 50\text{m}$ AND $10 \le I_{\text{ransac}} < 20$ AND $R_{\text{inlier}} \ge 0.22$ (Probable homography inliers)<br>• **OR** $d_{\text{gps}} \le 15\text{m}$ AND Category Match AND $I_{\text{ransac}} \ge 6$ | • Marked as tentative duplicate<br>• `is_duplicate = False` (**NEVER auto-merged**)<br>• `duplicate_review_status = "PENDING_ADMIN_REVIEW"`<br>• Routed to Admin Portal for inspector review |
| **Tier 3: Distinct** | `NEW_ISSUE` | • No candidates within $d_{\text{gps}} \le 50\text{m}$<br>• **OR** all candidates have $D_H > 10$ AND $I_{\text{ransac}} < 10$ (Distinct physical surfaces) | • Created as distinct ticket<br>• `canonical_issue_id = None`<br>• `is_duplicate = False`<br>• `duplicate_review_status = "NONE"` |

> [!IMPORTANT]
> **Spatial Distance Never Dictates Merging Alone:**
> Two distinct potholes or cracks can exist 5 meters apart on the same street. If two reports are within 5 meters but show distinct visual evidence ($D_H > 10$ and $I_{\text{ransac}} < 10$), the system strictly classifies them as **`NEW_ISSUE`**. Reports are **never merged solely because they are close together**.

---

## 3. Mathematical Foundations

### A. Great-Circle Distance (Haversine Formula)
$$\Delta \sigma = 2 \arcsin \left( \sqrt{ \sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right) } \right)$$
$$d = R \cdot \Delta \sigma$$
Where $R = 6,371,000 \text{ m}$.

### B. 64-bit DCT Perceptual Hashing
1. Downsample image to $32 \times 32$ grayscale.
2. Compute 2D Discrete Cosine Transform (DCT).
3. Retain top-left $8 \times 8$ low-frequency sub-matrix (excluding DC component $[0, 0]$ to ensure lighting invariance).
4. Compute median value of the 64 coefficients:
   $$b_i = \begin{cases} 1 & \text{if } C_i > \text{median}(C) \\ 0 & \text{otherwise} \end{cases}$$
5. Calculate Hamming distance $D_H = \sum_{i=1}^{64} b_i^{(1)} \oplus b_i^{(2)}$.

### C. Feature-Based Homography & RANSAC Verification
1. Extract $N=1,000$ ORB keypoints and 256-bit binary descriptors.
2. Match using `cv2.BFMatcher(cv2.NORM_HAMMING)`.
3. Apply Lowe's ratio test ($d_{\text{first}} < 0.75 \times d_{\text{second}}$).
4. Estimate projective homography matrix $H \in \mathbb{R}^{3 \times 3}$ using RANSAC with 5.0 px reprojection threshold:
   $$\begin{bmatrix} x' \\ y' \\ 1 \end{bmatrix} \sim H \begin{bmatrix} x \\ y \\ 1 \end{bmatrix}$$
5. Calculate inlier ratio $R = \frac{I}{M_{\text{good}}}$.

---

## 4. Canonical Issue Linking & Preservation

When multiple citizens report the same road hazard:
1. **Preservation**: Every submission is stored as an independent record in MongoDB Atlas and SQLite, preserving the citizen ID, original uploaded image, GPS coordinates, notes, and submission timestamp.
2. **Canonical Parent**: The earliest or primary ticket is established as the canonical issue.
3. **Child Linking**: Confirmed duplicate submissions set `canonical_issue_id = canonical_report.id`.
4. **Cluster Resolution**: If a citizen report matches an issue that is already linked to a canonical parent, it links directly to the root parent, preventing duplicate daisy chains.

---

## 5. Configurable Thresholds

Configured in `backend/app/core/config.py` and overrideable dynamically in `DuplicateEngineThresholds`:

| Parameter | Default | Description |
| :--- | :--- | :--- |
| `DUPLICATE_GPS_SEARCH_RADIUS_METERS` | `50.0` | Radius for candidate spatial pre-filtering |
| `DUPLICATE_CLOSE_PROXIMITY_METERS` | `15.0` | Distance threshold for close-proximity checks |
| `DUPLICATE_PHASH_IDENTICAL_HAMMING` | `4` | Max Hamming distance for identical photos |
| `DUPLICATE_PHASH_SIMILAR_HAMMING` | `10` | Max Hamming distance for visual resemblance |
| `DUPLICATE_ORB_MIN_INLIERS_CONFIRMED` | `20` | Min RANSAC inliers for confirmed viewpoint match |
| `DUPLICATE_ORB_MIN_RATIO_CONFIRMED` | `0.35` | Min geometric inlier ratio for confirmed match |
| `DUPLICATE_ORB_MIN_INLIERS_UNCERTAIN` | `10` | Min inliers for uncertain / admin review |
| `DUPLICATE_ORB_MIN_RATIO_UNCERTAIN` | `0.22` | Min inlier ratio for uncertain / admin review |
| `DUPLICATE_LOWE_RATIO` | `0.75` | Lowe's ratio test threshold |
| `DUPLICATE_RANSAC_REPROJ_THRESH` | `5.0` | RANSAC reprojection error threshold (px) |

---

## 6. API Endpoints

- `POST /api/reports/check-duplicate`: Evaluates candidate duplicates before submission; returns top match, inlier counts, and classification verdict.
- `POST /api/reports/sync`: Synchronizes an offline or online report; automatically runs the hybrid engine, links canonical tickets, and populates duplicate review queues.
- `GET /api/reports/duplicates/pending-review`: Lists all uncertain issues awaiting municipal inspector review.
- `GET /api/reports/{id}/duplicate-cluster`: Returns the primary canonical ticket and all child duplicate reports.
- `POST /api/reports/{id}/duplicate-review`: Admin endpoint to confirm (`CONFIRM_DUPLICATE`) or dismiss (`DISMISS_DUPLICATE`) a candidate link.

