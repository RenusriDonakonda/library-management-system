-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  member_since TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Create books table
CREATE TABLE public.books (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  isbn TEXT UNIQUE,
  description TEXT,
  cover_image TEXT,
  category TEXT,
  available_copies INTEGER NOT NULL DEFAULT 0,
  total_copies INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- Books policies - everyone can view books
CREATE POLICY "Anyone can view books"
  ON public.books FOR SELECT
  USING (true);

-- Create borrowings table
CREATE TABLE public.borrowings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  borrowed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  returned_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'borrowed' CHECK (status IN ('borrowed', 'returned', 'overdue')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.borrowings ENABLE ROW LEVEL SECURITY;

-- Borrowings policies
CREATE POLICY "Users can view their own borrowings"
  ON public.borrowings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own borrowings"
  ON public.borrowings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create cart_items table
CREATE TABLE public.cart_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  book_id UUID NOT NULL REFERENCES public.books(id) ON DELETE CASCADE,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, book_id)
);

-- Enable RLS
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Cart policies
CREATE POLICY "Users can manage their own cart"
  ON public.cart_items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_books_updated_at
  BEFORE UPDATE ON public.books
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email
  );
  RETURN new;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert sample books
INSERT INTO public.books (title, author, isbn, description, category, available_copies, total_copies, cover_image) VALUES
('The Great Gatsby', 'F. Scott Fitzgerald', '978-0743273565', 'A classic American novel set in the Jazz Age, exploring themes of wealth, love, and the American Dream.', 'Fiction', 5, 5, 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400'),
('To Kill a Mockingbird', 'Harper Lee', '978-0061120084', 'A gripping tale of racial injustice and childhood innocence in the American South.', 'Fiction', 3, 5, 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400'),
('1984', 'George Orwell', '978-0451524935', 'A dystopian social science fiction novel and cautionary tale about totalitarianism.', 'Science Fiction', 4, 4, 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400'),
('Pride and Prejudice', 'Jane Austen', '978-0141439518', 'A romantic novel of manners set in Georgian England.', 'Romance', 6, 6, 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'),
('The Hobbit', 'J.R.R. Tolkien', '978-0547928227', 'A fantasy novel about the adventures of Bilbo Baggins.', 'Fantasy', 2, 5, 'https://images.unsplash.com/photo-1621351183012-e2f9972dd9bf?w=400'),
('Harry Potter and the Sorcerers Stone', 'J.K. Rowling', '978-0439708180', 'The first book in the beloved Harry Potter series.', 'Fantasy', 8, 10, 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400'),
('The Catcher in the Rye', 'J.D. Salinger', '978-0316769488', 'A story about teenage rebellion and alienation.', 'Fiction', 3, 3, 'https://images.unsplash.com/photo-1612330177317-7dee25e0ab90?w=400'),
('Sapiens', 'Yuval Noah Harari', '978-0062316110', 'A brief history of humankind exploring human evolution and societies.', 'Non-Fiction', 7, 7, 'https://images.unsplash.com/photo-1589998059171-988d887df646?w=400');