import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { BookOpen, Search, TrendingUp, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BookCard } from "@/components/BookCard";

const Index = () => {
  const [featuredBooks, setFeaturedBooks] = useState<any[]>([]);

  useEffect(() => {
    fetchFeaturedBooks();
  }, []);

  const fetchFeaturedBooks = async () => {
    const { data } = await supabase
      .from("books")
      .select("*")
      .limit(4);
    if (data) setFeaturedBooks(data);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              Discover Your Next
              <span className="block bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Great Read
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Browse thousands of books, manage your reading journey, and connect with a community of book lovers.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/books">
                <Button size="lg" className="gap-2 shadow-elevation-3 hover:shadow-elevation-4">
                  <Search className="h-5 w-5" />
                  Browse Books
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="lg" variant="secondary" className="gap-2 shadow-elevation-2 hover:shadow-elevation-3">
                  <BookOpen className="h-5 w-5" />
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose LibraryHub?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card p-6 rounded-lg shadow-elevation-2 hover:shadow-elevation-3 transition-all">
              <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Vast Collection</h3>
              <p className="text-muted-foreground">
                Access thousands of books across multiple genres and categories.
              </p>
            </div>
            <div className="bg-card p-6 rounded-lg shadow-elevation-2 hover:shadow-elevation-3 transition-all">
              <div className="bg-accent/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <Clock className="h-6 w-6 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Easy Borrowing</h3>
              <p className="text-muted-foreground">
                Simple cart system to borrow multiple books at once with flexible due dates.
              </p>
            </div>
            <div className="bg-card p-6 rounded-lg shadow-elevation-2 hover:shadow-elevation-3 transition-all">
              <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Track Progress</h3>
              <p className="text-muted-foreground">
                Monitor your reading history and manage borrowed books effortlessly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Books */}
      {featuredBooks.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold">Featured Books</h2>
              <Link to="/books">
                <Button variant="ghost">View All</Button>
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredBooks.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-card border-t border-border py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>&copy; 2025 LibraryHub. Built with care for book lovers.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
