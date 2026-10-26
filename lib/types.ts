export type Skill =
  | 'Tractor Operation'
  | 'Irrigation Systems'
  | 'Harvest Equipment'
  | 'Livestock Handling'
  | 'Crop Scouting'
  | 'Pesticide Application'
  | 'Soil Management'
  | 'Greenhouse Operations'
  | 'Food Safety'
  | 'Machinery Repair'
  | 'Forklift Operation'
  | 'Quality Control'
  | 'Packaging'
  | 'Logistics'
  | 'Team Leadership';

export type JobType = string;

export type JobStatus = 'active' | 'closed';
export type ApplicationStatus = 'pending' | 'accepted' | 'rejected';
export type JobLanguage = 'tr' | 'en' | 'ar';
export type FeaturedTier = 'standard' | 'featured' | 'pinned';
export type PaymentStatus = 'free' | 'pending' | 'paid' | 'failed';

export interface Job {
  id: string;
  title: string;
  farm_name: string;
  job_type: JobType;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  wage: number | null;
  wage_min: number | null;
  wage_max: number | null;
  wage_unit: string;
  duration: string;
  requirements: string[];
  openings: number;
  status: JobStatus;
  is_featured: boolean;
  featured_tier: FeaturedTier;
  featured_until: string | null;
  payment_status: PaymentStatus;
  skills: string[];
  language: JobLanguage;
  title_tr: string | null;
  title_en: string | null;
  title_ar: string | null;
  description_tr: string | null;
  description_en: string | null;
  description_ar: string | null;
  location_tr: string | null;
  location_en: string | null;
  location_ar: string | null;
  requirements_tr: string[] | null;
  requirements_en: string[] | null;
  requirements_ar: string[] | null;
  created_at: string;
}

export interface Application {
  id: string;
  job_id: string;
  applicant_id?: string | null;
  applicant_name: string;
  applicant_phone: string;
  applicant_email: string;
  message: string;
  status: ApplicationStatus;
  created_at: string;
  job?: Job;
  cv_document_id?: string | null;
  cover_letter_document_id?: string | null;
  cv_method?: 'pdf' | 'manual' | null;
  cv_text?: string | null;
  cover_letter_text?: string | null;
}

export interface JobInput {
  title: string;
  farm_name: string;
  job_type: JobType;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  wage?: number | null;
  wage_min?: number | null;
  wage_max?: number | null;
  wage_unit: string;
  duration: string;
  requirements: string[];
  openings: number;
  skills?: string[];
  is_featured?: boolean;
  featured_tier?: FeaturedTier;
  featured_until?: string | null;
  payment_status?: PaymentStatus;
  language: JobLanguage;
}

export interface AdRequest {
  id: string;
  company_name: string;
  contact_email: string;
  contact_phone: string;
  target_placement: string;
  target_url: string | null;
  banner_design_option: 'self_provided' | 'custom_design';
  banner_file_url: string | null;
  design_notes: string | null;
  message: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'converted';
  created_at: string;
}

export type AcademyDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type LessonType = 'video' | 'article';

export interface AcademyCourse {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: AcademyDifficulty;
  thumbnail_url: string | null;
  estimated_minutes: number;
  instructor_name: string | null;
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface AcademyLesson {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  content: string | null;
  lesson_type: LessonType;
  duration_minutes: number;
  sort_order: number;
  is_published: boolean;
  created_at: string;
}

export interface AcademyEnrollment {
  id: string;
  user_id: string;
  course_id: string;
  progress: number;
  completed_lessons: number[];
  enrolled_at: string;
  last_accessed_at: string;
  course?: AcademyCourse;
}

export interface JobCategory {
  id: string;
  name: string;
  color: string;
  sort_order: number;
  is_active: boolean;
  icon_type: 'lucide' | 'custom';
  icon_name: string;
  icon_svg_path: string | null;
  translation_tr: string;
  translation_en: string;
  translation_ar: string;
}

export interface CommodityCategory {
  id: string;
  key: string;
  sort_order: number;
  translation_tr: string;
  translation_en: string;
  translation_ar: string;
}

export type NotificationStatus = 'pending' | 'sent' | 'failed';
export type NotificationType = 'job_application' | 'application_status' | 'new_message';

export type SenderRole = 'employer' | 'applicant';

export interface Conversation {
  id: string;
  job_id: string | null;
  employer_id: string;
  applicant_id: string | null;
  applicant_name: string;
  applicant_email: string;
  application_id: string | null;
  last_message_at: string;
  created_at: string;
  job?: Job;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_role: SenderRole;
  body: string;
  is_read: boolean;
  created_at: string;
}

export type DocumentType = 'cv' | 'cover_letter';
export type ContentMethod = 'pdf' | 'manual';

export interface UserDocument {
  id: string;
  user_id: string;
  document_type: DocumentType;
  title: string;
  content_method: ContentMethod;
  file_path: string | null;
  manual_text: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  recipient_email: string;
  recipient_name: string | null;
  notification_type: NotificationType;
  subject: string;
  body: string;
  related_job_id: string | null;
  related_application_id: string | null;
  status: NotificationStatus;
  sent_at: string | null;
  error_message: string | null;
  created_at: string;
}

export type CropFieldStatus = 'planning' | 'planted' | 'growing' | 'ready' | 'harvested';

export interface CropField {
  id: string;
  user_id: string;
  name: string;
  crop_type: string;
  field_size: number;
  size_unit: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  planting_date: string | null;
  expected_harvest_date: string | null;
  status: CropFieldStatus;
  notes: string | null;
  temp_min_threshold: number;
  temp_max_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface CropFieldInput {
  name: string;
  crop_type: string;
  field_size: number;
  size_unit: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  planting_date: string | null;
  expected_harvest_date: string | null;
  status: CropFieldStatus;
  notes?: string | null;
  temp_min_threshold?: number;
  temp_max_threshold?: number;
}

export interface TemperatureLog {
  id: string;
  field_id: string;
  temperature: number;
  recorded_at: string;
  notes: string | null;
  created_at: string;
}

export interface TemperatureLogInput {
  field_id: string;
  temperature: number;
  recorded_at: string;
  notes?: string | null;
}

export interface CropCard {
  id: string;
  title_tr: string;
  title_en: string;
  title_ar: string;
  description_tr: string;
  description_en: string;
  description_ar: string;
  image_url: string;
  video_url: string;
  sort_order: number;
  is_visible: boolean;
  updated_at: string;
}
