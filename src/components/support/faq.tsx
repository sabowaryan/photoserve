"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface FAQProps {
  items?: FAQItem[];
}

const defaultFAQItems: FAQItem[] = [
  // Installation & Setup
  {
    id: "install-windows",
    question: "How do I install the PikSend plugin on Windows?",
    answer:
      "Download the .lrplugin file, then in Lightroom go to File > Plug-in Manager > Add. Navigate to the downloaded file and select it. The plugin will be installed and ready to use.",
    category: "Installation & Setup",
  },
  {
    id: "install-mac",
    question: "How do I install the PikSend plugin on macOS?",
    answer:
      "Download the .lrplugin file, then in Lightroom go to File > Plug-in Manager > Add. Navigate to the downloaded file and select it. You may need to allow the plugin in System Preferences > Security & Privacy if prompted.",
    category: "Installation & Setup",
  },
  {
    id: "api-key-setup",
    question: "How do I get an API key for the plugin?",
    answer:
      "You need a Pro plan subscription. Once subscribed, go to Settings > API Keys in your PikSend dashboard, click 'Create API Key', give it a name, and copy the generated key. Enter this key in the Lightroom plugin settings.",
    category: "Installation & Setup",
  },
  {
    id: "verify-connection",
    question: "How do I verify the plugin is connected to my account?",
    answer:
      "In Lightroom, open the plugin settings and click 'Test Connection'. If successful, you'll see your account name and email displayed. You can also check the 'Last Used' timestamp in your API Keys dashboard.",
    category: "Installation & Setup",
  },

  // Usage & Features
  {
    id: "create-gallery",
    question: "How do I create a gallery from Lightroom?",
    answer:
      "Select the photos you want to include, then go to File > Plug-in Extras > PikSend > Create Gallery. Enter a gallery name, configure settings like password protection or expiration date, and click Create. The plugin will upload your photos and provide a shareable link.",
    category: "Usage & Features",
  },
  {
    id: "upload-limit",
    question: "How many photos can I upload at once?",
    answer:
      "The upload limit depends on your plan. Pro users can upload up to 500 photos per gallery. For larger galleries, consider splitting them into multiple galleries or contact support for enterprise options.",
    category: "Usage & Features",
  },
  {
    id: "supported-formats",
    question: "What image formats are supported?",
    answer:
      "The plugin supports JPEG, PNG, TIFF, and RAW formats. RAW files will be converted to JPEG for web display while preserving EXIF data. We recommend exporting as high-quality JPEG for best performance.",
    category: "Usage & Features",
  },
  {
    id: "watermark",
    question: "Can I add watermarks to my photos?",
    answer:
      "Yes! In the plugin settings, you can upload a watermark image and configure its position, size, and opacity. The watermark will be applied to all photos during upload.",
    category: "Usage & Features",
  },

  // Troubleshooting
  {
    id: "upload-failed",
    question: "Why did my upload fail?",
    answer:
      "Upload failures can occur due to network issues, file size limits, or invalid API keys. Check your internet connection, ensure your API key is valid and not expired, and verify you haven't exceeded your plan limits. Check the plugin logs for detailed error messages.",
    category: "Troubleshooting",
  },
  {
    id: "invalid-api-key",
    question: "I'm getting an 'Invalid API Key' error",
    answer:
      "This means your API key is incorrect, expired, or revoked. Go to Settings > API Keys in your dashboard to verify the key is active. If it's expired or revoked, create a new key and update it in the plugin settings.",
    category: "Troubleshooting",
  },
  {
    id: "slow-upload",
    question: "Why is the upload so slow?",
    answer:
      "Upload speed depends on your internet connection, file sizes, and server load. Try uploading during off-peak hours, reducing image file sizes, or checking your network connection. The plugin shows upload progress for each file.",
    category: "Troubleshooting",
  },
  {
    id: "plugin-not-showing",
    question: "The plugin doesn't appear in Lightroom",
    answer:
      "Ensure the plugin is properly installed via File > Plug-in Manager. If it's listed but not working, try restarting Lightroom. On macOS, check System Preferences > Security & Privacy to allow the plugin. If issues persist, reinstall the plugin.",
    category: "Troubleshooting",
  },

  // Account & Billing
  {
    id: "pro-required",
    question: "Do I need a Pro plan to use the plugin?",
    answer:
      "Yes, the Lightroom plugin is a Pro plan feature. You need an active Pro subscription to generate API keys and use the plugin. Upgrade to Pro in your account settings to access this feature.",
    category: "Account & Billing",
  },
  {
    id: "multiple-computers",
    question: "Can I use the same API key on multiple computers?",
    answer:
      "Yes, you can use the same API key on multiple computers. However, for security and tracking purposes, we recommend creating separate API keys for each device. You can manage all your keys in the API Keys dashboard.",
    category: "Account & Billing",
  },
  {
    id: "revoke-key",
    question: "How do I revoke an API key?",
    answer:
      "Go to Settings > API Keys in your dashboard, find the key you want to revoke, and click the 'Revoke' button. This immediately invalidates the key and prevents further use. You can also delete keys permanently.",
    category: "Account & Billing",
  },

  // Updates & Compatibility
  {
    id: "check-updates",
    question: "How do I update the plugin?",
    answer:
      "The plugin automatically checks for updates when Lightroom starts. If an update is available, you'll see a notification. Download the new version from your dashboard and install it following the same process as the initial installation.",
    category: "Updates & Compatibility",
  },
  {
    id: "lightroom-version",
    question: "What version of Lightroom do I need?",
    answer:
      "The plugin requires Lightroom Classic 11.0 or later. It's compatible with both Windows and macOS. Check the download page for specific version requirements for each plugin release.",
    category: "Updates & Compatibility",
  },
  {
    id: "lightroom-cc",
    question: "Does the plugin work with Lightroom CC (cloud)?",
    answer:
      "Currently, the plugin is designed for Lightroom Classic only. Lightroom CC (cloud-based) uses a different plugin architecture. We're exploring support for Lightroom CC in future releases.",
    category: "Updates & Compatibility",
  },
];

export function FAQ({ items = defaultFAQItems }: FAQProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Group items by category
  const categorizedItems = useMemo(() => {
    const filtered = items.filter(
      (item) =>
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const grouped = filtered.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category]!.push(item);
      return acc;
    }, {} as Record<string, FAQItem[]>);

    return grouped;
  }, [items, searchQuery]);

  const categories = Object.keys(categorizedItems);

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search FAQ..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* FAQ Items by Category */}
      {categories.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No FAQ items found matching your search.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {categories.map((category) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="text-lg">{category}</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {categorizedItems[category]!.map((item) => (
                    <AccordionItem key={item.id} value={item.id}>
                      <AccordionTrigger className="text-left">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
