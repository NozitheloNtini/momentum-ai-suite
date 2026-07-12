DROP TRIGGER IF EXISTS trg_saved_items_updated_at ON public.saved_items;
CREATE TRIGGER trg_saved_items_updated_at
  BEFORE UPDATE ON public.saved_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();