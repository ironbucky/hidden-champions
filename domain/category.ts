export interface ApprovedCategory {
  id: string;
  name: string;
  slug: string;
}

export const categoryPolicy = {
  isApprovedCategory(
    categoryNameOrSlug: string,
    approvedList: ApprovedCategory[]
  ): boolean {
    const normalized = categoryNameOrSlug.toLowerCase().trim();
    return approvedList.some(
      (category) =>
        category.name.toLowerCase() === normalized ||
        category.slug.toLowerCase() === normalized
    );
  },

  canSuggest(
    proposedName: string,
    existingNames: string[],
    options: { minLength?: number } = {}
  ): { ok: true } | { ok: false; reason: string } {
    const minLength = options.minLength ?? 2;
    const trimmed = proposedName.trim();

    if (trimmed.length < minLength) {
      return { ok: false, reason: "Category name is too short" };
    }

    const normalized = trimmed.toLowerCase();
    const duplicate = existingNames.some(
      (name) => name.toLowerCase() === normalized
    );

    if (duplicate) {
      return { ok: false, reason: "A matching category already exists" };
    }

    return { ok: true };
  },
};
