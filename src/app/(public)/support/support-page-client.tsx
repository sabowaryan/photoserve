"use client";

import Link from "next/link";
import {
  BookOpen,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { FAQ } from "@/components/support/faq";
import { SupportContactForm } from "@/components/support/support-contact-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function SupportPageClient() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl mb-4">
            How can we help you?
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Find answers to common questions, contact our support team, or
            browse our documentation.
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Link href="/docs/lightroom">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <BookOpen className="h-6 w-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">Documentation</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Complete guides for installation, setup, and usage of the
                  Lightroom plugin.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/docs/lightroom#troubleshooting">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <AlertCircle className="h-6 w-6 text-amber-600" />
                  </div>
                  <CardTitle className="text-lg">Troubleshooting</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Common issues and solutions to help you resolve problems
                  quickly.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/download/lightroom">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <FileText className="h-6 w-6 text-green-600" />
                  </div>
                  <CardTitle className="text-lg">Download Plugin</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Get the latest version of the PikSend Lightroom plugin.
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* System Status */}
        <Card className="mb-12">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>System Status</CardTitle>
              <Badge variant="default" className="bg-green-500">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                All Systems Operational
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-muted-foreground">API Services</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-muted-foreground">File Uploads</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-muted-foreground">Gallery Access</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support Hours & Response Time */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Support Hours & Response Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Support Hours</h3>
                <p className="text-sm text-muted-foreground mb-1">
                  Monday - Friday: 9:00 AM - 6:00 PM EST
                </p>
                <p className="text-sm text-muted-foreground">
                  Saturday - Sunday: Closed
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Expected Response Time</h3>
                <p className="text-sm text-muted-foreground mb-1">
                  Email Support: Within 24 hours (business days)
                </p>
                <p className="text-sm text-muted-foreground">
                  Critical Issues: Within 4 hours (business days)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* FAQ Section - Takes 2 columns */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-6">
              Frequently Asked Questions
            </h2>
            <FAQ />
          </div>

          {/* Contact Form - Takes 1 column */}
          <div>
            <h2 className="text-2xl font-bold mb-6">Contact Us</h2>
            <SupportContactForm />

            {/* Additional Help Resources */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Need More Help?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <h4 className="font-semibold mb-1">Email Support</h4>
                  <a
                    href="mailto:support@piksend.com"
                    className="text-blue-600 hover:underline"
                  >
                    support@piksend.com
                  </a>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Community Forum</h4>
                  <p className="text-muted-foreground">
                    Join our community to connect with other users and share
                    tips.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Video Tutorials</h4>
                  <p className="text-muted-foreground">
                    Watch step-by-step video guides on our YouTube channel.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
