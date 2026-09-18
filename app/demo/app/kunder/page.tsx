"use client";

import { useEffect, useState } from "react";
import { Customers, type CustomersData } from "@/screens/Customers";
import { useI18n } from "@/i18n/context";
import { demoOutreachProvider } from "@/adapters/demo/OutreachProvider";
import { useDemoStore } from "@/adapters/demo/demoStore";

export default function DemoCustomersPage() {
  const { locale } = useI18n();
  const beatIndex = useDemoStore((state) => state.beatIndex);
  const [data, setData] = useState<CustomersData | null>(null);

  useEffect(() => {
    let cancelled = false;
    demoOutreachProvider.getCampaign(locale).then((rows) => {
      if (!cancelled) setData({ rows });
    });
    return () => {
      cancelled = true;
    };
  }, [locale, beatIndex]);

  if (!data) return null;

  return <Customers data={data} />;
}
