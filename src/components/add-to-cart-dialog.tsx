import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Text } from "@/components/ui/text";

export const ADD_TO_CART_MESSAGE =
  "Add every matched item in this grocery list to my Kroger cart now.";

export function AddToCartDialog({
  open,
  onOpenChange,
  onConfirm,
  itemCount,
  subtotal = 0,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  itemCount: number;
  subtotal?: number;
}) {
  return (
    <AlertDialog onOpenChange={onOpenChange} open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Add {itemCount} matched {itemCount === 1 ? "item" : "items"} to Kroger?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Only matched products will be sent to your cart. You’ll review availability and complete
            checkout with Kroger.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {subtotal > 0 ? (
          <Text selectable>Estimated subtotal: ${subtotal.toFixed(2)}</Text>
        ) : (
          <Text variant="muted">Final prices are shown in your Kroger cart.</Text>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel onPress={() => onOpenChange(false)}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={itemCount === 0}
            onPress={() => {
              onOpenChange(false);
              onConfirm();
            }}
          >
            Add to cart
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
