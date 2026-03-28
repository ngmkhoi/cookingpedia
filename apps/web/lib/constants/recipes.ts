export const RECIPE_STATUS_LABELS = {
  DRAFT: { vi: "Bản nháp", en: "Draft" },
  PENDING: { vi: "Chờ duyệt", en: "Pending" },
  PUBLISHED: { vi: "Đã đăng", en: "Published" },
  REJECTED: { vi: "Bị từ chối", en: "Rejected" }
} as const;

export const RECIPE_SORT_OPTIONS = [
  { value: "newest", label: { vi: "Mới nhất", en: "Newest" } },
  { value: "mostSaved", label: { vi: "Được lưu nhiều", en: "Most saved" } }
] as const;
