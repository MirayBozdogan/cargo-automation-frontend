export interface Staff {
    id: number; name: string; surname: string; email: string;
    age: number; tc: string; telNo: string; role: "STAFF"; active: boolean;
}
export interface StaffPage { content: Staff[]; number: number; totalPages: number; totalElements: number }
export interface StaffDetails { name: string; surname: string; email: string; age: number; tc: string; telNo: string }
export interface StaffFormValues { name: string; surname: string; email: string; age: string; tc: string; telNo: string }
export interface StaffSubmission { details: StaffDetails; password?: string }
