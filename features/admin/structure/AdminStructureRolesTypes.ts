import type { OrgMember } from "@/lib/domain/admin/structure";

export type UpdateOrgMember = (id: string, field: keyof OrgMember, value: string | boolean) => void;

export type UpdateOrgMemberForm = (field: keyof OrgMember, value: string | boolean) => void;
