import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Trash2, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Session } from "@supabase/supabase-js";

const Cart = () => {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(false);
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
      fetchCart();
    }
  }, [session]);

  const fetchCart = async () => {
    const { data } = await supabase
      .from("cart_items")
      .select(`
        id,
        book_id,
        books (*)
      `);
    if (data) {
      setCartItems(data);
    }
  };

  const handleRemoveFromCart = async (cartItemId: string) => {
    const { error } = await supabase.from("cart_items").delete().eq("id", cartItemId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to remove item from cart.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Removed from cart",
      });
      fetchCart();
    }
  };

  const handleBorrowAll = async () => {
    if (!session || cartItems.length === 0) return;

    setLoading(true);
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14); // 14 days borrowing period

    const borrowings = cartItems.map((item) => ({
      user_id: session.user.id,
      book_id: item.book_id,
      due_date: dueDate.toISOString(),
      status: "borrowed",
    }));

    const { error: borrowError } = await supabase.from("borrowings").insert(borrowings);

    if (borrowError) {
      toast({
        title: "Error",
        description: "Failed to borrow books. Please try again.",
        variant: "destructive",
      });
    } else {
      // Clear cart
      const { error: clearError } = await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", session.user.id);

      if (!clearError) {
        toast({
          title: "Success!",
          description: `Successfully borrowed ${cartItems.length} book(s).`,
        });
        navigate("/dashboard");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Your Cart</h1>
          <p className="text-muted-foreground">
            Review and borrow your selected books
          </p>
        </div>

        {cartItems.length === 0 ? (
          <Card className="p-12 text-center shadow-elevation-2">
            <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">Your cart is empty</h3>
            <p className="text-muted-foreground mb-4">
              Add some books to get started
            </p>
            <Button onClick={() => navigate("/books")}>Browse Books</Button>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="grid gap-4">
              {cartItems.map((item) => (
                <Card key={item.id} className="p-4 shadow-elevation-2">
                  <div className="flex gap-4">
                    <img
                      src={item.books.cover_image || "/placeholder.svg"}
                      alt={item.books.title}
                      className="w-20 h-28 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{item.books.title}</h3>
                      <p className="text-muted-foreground">{item.books.author}</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Available: {item.books.available_copies} copies
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveFromCart(item.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            <Card className="p-6 shadow-elevation-3">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-semibold">Ready to borrow?</h3>
                  <p className="text-sm text-muted-foreground">
                    {cartItems.length} book(s) • 14 days borrowing period
                  </p>
                </div>
                <Button
                  onClick={handleBorrowAll}
                  disabled={loading}
                  size="lg"
                  className="shadow-elevation-2 hover:shadow-elevation-3"
                >
                  {loading ? "Processing..." : "Borrow All Books"}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
