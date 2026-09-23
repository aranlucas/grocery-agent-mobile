import { ScrollView } from "react-native";
import { useState } from "react";
import { Disclosure } from "@/components/ui/disclosure";
import { Text } from "@/components/ui/text";
import { BrandMark } from "@/components/brand-mark";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SafeArea } from "@/components/ui/safe-area";

export function ConfigurationError({ message }: { message: string }) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  return (
    <SafeArea>
      <ScrollView
        className="w-full max-w-md self-center"
        contentContainerClassName="flex-grow justify-center gap-6 p-6"
        contentInsetAdjustmentBehavior="automatic"
      >
        <BrandMark size="lg" />
        <Card>
          <CardHeader className="gap-2.5 pb-0">
            <Badge className="self-start" variant="outline">
              Setup needed
            </Badge>
            <CardTitle selectable>Grocery Agent couldn’t start.</CardTitle>
          </CardHeader>
          <CardContent className="pt-2.5">
            <Text>
              Required app settings are missing. Please contact support or install a configured
              build.
            </Text>
            <Disclosure label="Technical details" open={detailsOpen} onOpenChange={setDetailsOpen}>
              <CardDescription selectable>{message}</CardDescription>
            </Disclosure>
          </CardContent>
        </Card>
      </ScrollView>
    </SafeArea>
  );
}
