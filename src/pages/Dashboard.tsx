import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Session } from "@supabase/supabase-js";
import { format, isAfter } from "date-fns";

const Dashboard = () => {
  const [borrowings, setBorrowings] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    borrowed: 0,
    overdue: 0,
    returned: 0,
  });
  const [session, setSession] = useState<Session | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (session) {
      fetchBorrowings();
    }
  }, [session]);

  const fetchBorrowings = async () => {
    const { data } = await supabase
      .from("borrowings")
      .select(`
        *,
        books (*)
      `)
      .order("borrowed_at", { ascending: false });

    if (data) {
      setBorrowings(data);
      calculateStats(data);
    }
  };

  const calculateStats = (borrowings: any[]) => {
    const total = borrowings.length;
    const borrowed = borrowings.filter((b) => b.status === "borrowed").length;
    const returned = borrowings.filter((b) => b.status === "returned").length;
    const overdue = borrowings.filter(
      (b) => b.status === "borrowed" && isAfter(new Date(), new Date(b.due_date))
    ).length;

    setStats({ total, borrowed, overdue, returned });
  };

  const handleReturn = async (borrowingId: string) => {
    const { error } = await supabase
      .from("borrowings")
      .update({
        status: "returned",
        returned_at: new Date().toISOString(),
      })
      .eq("id", borrowingId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to return book.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Book returned",
        description: "Thank you for returning the book!",
      });
      fetchBorrowings();
    }
  };

  const getStatusBadge = (borrowing: any) => {
    if (borrowing.status === "returned") {
      return <Badge variant="secondary">Returned</Badge>;
    }
    if (isAfter(new Date(), new Date(borrowing.due_date))) {
      return <Badge variant="destructive">Overdue</Badge>;
    }
    return <Badge className="bg-primary">Borrowed</Badge>;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your borrowed books and reading progress
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 shadow-elevation-2">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Books</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-elevation-2">
            <div className="flex items-center gap-4">
              <div className="bg-accent/10 p-3 rounded-lg">
                <Clock className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Currently Borrowed</p>
                <p className="text-2xl font-bold">{stats.borrowed}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-elevation-2">
            <div className="flex items-center gap-4">
              <div className="bg-destructive/10 p-3 rounded-lg">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold">{stats.overdue}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 shadow-elevation-2">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-3 rounded-lg">
                <CheckCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Returned</p>
                <p className="text-2xl font-bold">{stats.returned}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Borrowings List */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Your Books</h2>
          {borrowings.length === 0 ? (
            <Card className="p-12 text-center shadow-elevation-2">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No books borrowed yet</h3>
              <p className="text-muted-foreground mb-4">
                Start exploring our collection
              </p>
              <Button onClick={() => navigate("/books")}>Browse Books</Button>
            </Card>
          ) : (
            <div className="grid gap-4">
              {borrowings.map((borrowing) => (
                <Card key={borrowing.id} className="p-4 shadow-elevation-2">
                  <div className="flex gap-4">
                    <img
                      src={borrowing.books.cover_image || "/placeholder.svg"}
                      alt={borrowing.books.title}
                      className="w-20 h-28 object-cover rounded"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {borrowing.books.title}
                          </h3>
                          <p className="text-muted-foreground">
                            {borrowing.books.author}
                          </p>
                        </div>
                        {getStatusBadge(borrowing)}
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                        <div>
                          <span className="font-medium">Borrowed:</span>{" "}
                          {format(new Date(borrowing.borrowed_at), "PPP")}
                        </div>
                        <div>
                          <span className="font-medium">Due:</span>{" "}
                          {format(new Date(borrowing.due_date), "PPP")}
                        </div>
                        {borrowing.returned_at && (
                          <div className="col-span-2">
                            <span className="font-medium">Returned:</span>{" "}
                            {format(new Date(borrowing.returned_at), "PPP")}
                          </div>
                        )}
                      </div>
                      {borrowing.status === "borrowed" && (
                        <Button
                          onClick={() => handleReturn(borrowing.id)}
                          className="mt-3"
                          size="sm"
                        >
                          Return Book
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
