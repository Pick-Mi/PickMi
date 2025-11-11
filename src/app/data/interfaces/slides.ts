export interface PickSlide {
  id?: string;
  title: string;
  image_path: string;
  target_page?: string | null;
  position?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}
