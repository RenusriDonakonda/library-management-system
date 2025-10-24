import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { BookCard } from "@/components/BookCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search } from "lucide-react";
import { Session } from "@supabase/supabase-js";

const Books = () => {
  const [books, setBooks] = useState<any[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [cartItems, setCartItems] = useState<string[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    fetchBooks();
    if (session) {
      fetchCartItems();
    }
  }, [session]);

  useEffect(() => {
    filterBooks();
  }, [searchQuery, categoryFilter, books]);

  const fetchBooks = async () => {
    const { data } = await supabase.from("books").select("*").order("title");
    if (data) {
      setBooks(data);
      setFilteredBooks(data);
    }
  };

  const fetchCartItems = async () => {
    const { data } = await supabase.from("cart_items").select("book_id");
    if (data) {
      setCartItems(data.map((item) => item.book_id));
    }
  };

  const filterBooks = () => {
    let filtered = books;

    if (searchQuery) {
      filtered = filtered.filter(
        (book) =>
          book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          book.author.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((book) => book.category === categoryFilter);
    }

    setFilteredBooks(filtered);
  };

  const handleAddToCart = async (bookId: string) => {
    if (!session) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to add books to cart.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("cart_items").insert({
      user_id: session.user.id,
      book_id: bookId,
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to add book to cart.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Added to cart",
        description: "Book has been added to your cart.",
      });
      fetchCartItems();
    }
    setLoading(false);
  };

  const categories = Array.from(new Set(books.map((book) => book.category).filter(Boolean)));

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Browse Books</h1>
          <p className="text-muted-foreground">
            Discover your next favorite book from our collection
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title or author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 shadow-elevation-1"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[200px] shadow-elevation-1">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Books Grid */}
        {filteredBooks.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">No books found</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onAddToCart={handleAddToCart}
                inCart={cartItems.includes(book.id)}
                isLoading={loading}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Books;
