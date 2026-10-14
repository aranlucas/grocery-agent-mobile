import { useClerk, useUser } from "@clerk/expo";
import Constants from "expo-constants";
import * as WebBrowser from "expo-web-browser";
import { useRouter } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import {
  BookMarked,
  CircleHelp,
  FileText,
  Flag,
  ListChecks,
  LogOut,
  Shield,
  ShoppingBasket,
  Trash2,
  Users,
} from "lucide-react-native";
import { Alert } from "@/components/ui/alert";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Icon } from "@/components/ui/icon";
import { NavigationRow } from "@/components/ui/navigation-row";
import { Screen } from "@/components/ui/screen";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import { useKrogerConnection } from "@/hooks/use-kroger-connection";
import { userInitials } from "@/lib/auth";
import { getLegalLinks } from "@/lib/config";

export default function AccountScreen() {
  const router = useRouter();
  const { user } = useUser();
  const { signOut } = useClerk();
  const connection = useKrogerConnection();
  const { connected, isLoading, reconnecting, connecting, error: connectionError } = connection;
  const [pageError, setPageError] = useState("");
  const [signingOut, setSigningOut] = useState(false);
  const links = getLegalLinks();
  const open = async (url: string) => {
    setPageError("");
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch {
      setPageError("That page could not be opened. Check your connection and try again.");
    }
  };
  return (
    <Screen contentContainerClassName="gap-6">
      <View className="flex-row items-center gap-4">
        <Avatar
          accessibilityLabel={user?.fullName ?? "Account profile"}
          fallback={userInitials(user)}
          size="lg"
          src={user?.imageUrl}
        />
        <View className="min-w-0 flex-1 gap-1">
          <Text selectable variant="h4">
            {user?.fullName ?? "Grocery Agent member"}
          </Text>
          <Text selectable variant="muted">
            {user?.primaryEmailAddress?.emailAddress}
          </Text>
        </View>
      </View>
      <Card className="gap-4">
        <View className="flex-row gap-3">
          <Icon as={ShoppingBasket} className="size-6 text-primary" />
          <View className="flex-1 gap-1">
            <CardTitle>Kroger</CardTitle>
            <CardDescription>
              {isLoading && !connecting
                ? "Checking your connection…"
                : connected
                  ? "Connected · Live prices and cart access"
                  : "Optional · Live prices and cart access"}
            </CardDescription>
          </View>
        </View>
        <Text variant="muted">
          {connected
            ? "You’ll review your cart and check out with Kroger."
            : "You can plan meals and save lists without connecting a store."}
        </Text>
        <Button
          loading={connecting || reconnecting}
          disabled={isLoading}
          variant={connected ? "outline" : "default"}
          onPress={() => {
            connection.clearError();
            void (connected ? connection.reconnect() : connection.connect());
          }}
        >
          {connected ? "Reconnect Kroger" : "Connect Kroger"}
        </Button>
        {connectionError ? <Alert title={connectionError} variant="destructive" /> : null}
      </Card>
      <View className="gap-3">
        <Text variant="h4">Your groceries</Text>
        <Card className="overflow-hidden p-0">
          <NavigationRow
            icon={ShoppingBasket}
            title="Grocery plan"
            onPress={() => router.push("/list")}
          />
          <Separator className="ml-17" />
          <NavigationRow
            icon={ListChecks}
            title="Saved lists"
            onPress={() => router.push("/saved-lists")}
          />
          <Separator className="ml-17" />
          <NavigationRow
            icon={BookMarked}
            title="Saved recipes"
            onPress={() => router.push("/saved-recipes")}
          />
          <Separator className="ml-17" />
          <NavigationRow
            icon={Users}
            title="Households"
            onPress={() => router.push("/households")}
          />
        </Card>
      </View>
      <View className="gap-3">
        <Text variant="h4">Help and privacy</Text>
        <Card className="overflow-hidden p-0">
          <NavigationRow
            icon={Flag}
            title="Report a problem"
            onPress={() => router.push("/report")}
          />
          <Separator className="ml-17" />
          <NavigationRow
            icon={CircleHelp}
            title="Help and support"
            onPress={() => void open(links.support)}
          />
          <Separator className="ml-17" />
          <NavigationRow
            icon={Shield}
            title="Privacy policy"
            onPress={() => void open(links.privacy)}
          />
          <Separator className="ml-17" />
          <NavigationRow
            icon={FileText}
            title="Terms of use"
            onPress={() => void open(links.terms)}
          />
          <Separator className="ml-17" />
          <NavigationRow
            destructive
            icon={Trash2}
            title="Request account deletion"
            description="Opens the account deletion page"
            onPress={() => void open(links.deleteAccount)}
          />
        </Card>
      </View>
      {pageError ? <Alert title={pageError} variant="destructive" /> : null}
      <Button
        icon={<Icon as={LogOut} className="size-5 text-primary" />}
        variant="outline"
        loading={signingOut}
        onPress={() => {
          setSigningOut(true);
          setPageError("");
          void signOut()
            .catch(() => setPageError("Couldn’t sign out. Please try again."))
            .finally(() => setSigningOut(false));
        }}
      >
        Sign out
      </Button>
      <Text className="text-center" variant="muted">
        Grocery Agent {Constants.expoConfig?.version ?? ""}
      </Text>
    </Screen>
  );
}
