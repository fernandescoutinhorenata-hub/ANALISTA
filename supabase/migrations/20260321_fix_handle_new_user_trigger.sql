-- Fix: atualiza trigger handle_new_user para usar coluna ocr_uses (removida usos_restantes)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.perfis (id, nome, email, ocr_uses)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'team_name', NEW.raw_user_meta_data->>'full_name', ''),
        NEW.email,
        0
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;
