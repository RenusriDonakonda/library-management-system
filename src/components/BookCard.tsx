import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Check } from "lucide-react";

interface BookCardProps {
  book: {
    id: string;
    title: string;
    author: string;
    category: string | null;
    cover_image: string | null;
    available_copies: number;
    total_copies: number;
  };
  onAddToCart?: (bookId: string) => void;
  inCart?: boolean;
  isLoading?: boolean;
}

export const BookCard = ({ book, onAddToCart, inCart, isLoading }: BookCardProps) => {
  const isAvailable = book.available_copies > 0;

  return (
    <Card className="overflow-hidden shadow-elevation-2 hover:shadow-elevation-3 transition-all duration-300 group">
      <div className="aspect-[3/4] overflow-hidden bg-muted">
        <img
          src={book.cover_image || "/placeholder.svg"}
          alt={book.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>
      <div className="p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-lg line-clamp-2 text-foreground">{book.title}</h3>
          <p className="text-sm text-muted-foreground">{book.author}</p>
        </div>
        
        <div className="flex items-center justify-between">
          {book.category && (
            <Badge variant="secondary" className="text-xs">
              {book.category}
            </Badge>
          )}
          <span className={`text-sm font-medium ${isAvailable ? 'text-primary' : 'text-destructive'}`}>
            {book.available_copies}/{book.total_copies} Available
          </span>
        </div>

        {onAddToCart && (
          <Button
            onClick={() => onAddToCart(book.id)}
            disabled={!isAvailable || inCart || isLoading}
            className="w-full shadow-elevation-1 hover:shadow-elevation-2"
            variant={inCart ? "secondary" : "default"}
          >
            {inCart ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                In Cart
              </>
            ) : (
              <>
                <ShoppingCart className="h-4 w-4 mr-2" />
                Add to Cart
              </>
            )}
          </Button>
        )}
      </div>
    </Card>
  );
};
