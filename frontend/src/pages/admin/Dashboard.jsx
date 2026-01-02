import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Package, Users, CreditCard, Activity, Plus } from "lucide-react";
import SuperAdminNavigation from "../../components/admin/SuperAdminNavigation";

const Dashboard = () => {
  const stats = [
    {
      title: "Total Orders",
      value: "1,234",
      icon: <Package className="h-6 w-6 text-muted-foreground" />,
      change: "+12% from last month",
    },
    {
      title: "Active Customers",
      value: "456",
      icon: <Users className="h-6 w-6 text-muted-foreground" />,
      change: "+8% from last month",
    },
    {
      title: "Revenue",
      value: "₹89,456",
      icon: <CreditCard className="h-6 w-6 text-muted-foreground" />,
      change: "+19% from last month",
    },
    {
      title: "Active Subscriptions",
      value: "234",
      icon: <Activity className="h-6 w-6 text-muted-foreground" />,
      change: "+5% from last month",
    },
  ];

  const quickActions = [
    {
      title: "Manage Charges",
      description: "View and manage all charges and fees",
      icon: <CreditCard className="h-8 w-8" />,
      link: "/admin/charges",
      buttonText: "Manage",
    },
    {
      title: "View Orders",
      description: "View and manage customer orders",
      icon: <Package className="h-8 w-8" />,
      link: "/admin/orders",
      buttonText: "View",
    },
    {
      title: "Manage Customers",
      description: "View and manage customer accounts",
      icon: <Users className="h-8 w-8" />,
      link: "/admin/customers",
      buttonText: "Manage",
    },
  ];

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Button>Download Report</Button>
        </div>
      </div>

      {/* Super Admin Navigation */}
      <SuperAdminNavigation />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <div className="h-4 w-4 text-muted-foreground">{stat.icon}</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {quickActions.map((action, index) => (
          <Card key={index} className="flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{action.title}</CardTitle>
                <div className="rounded-lg bg-primary/10 p-2">
                  {action.icon}
                </div>
              </div>
              <CardDescription>{action.description}</CardDescription>
            </CardHeader>
            <div className="mt-auto p-6 pt-0">
              <Button asChild className="w-full">
                <Link to={action.link}>{action.buttonText}</Link>
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      Order #{Math.floor(Math.random() * 10000)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {
                        ["Pending", "Processing", "Completed", "Cancelled"][
                          i % 4
                        ]
                      }
                    </p>
                  </div>
                  <div className="text-sm font-medium">
                    ₹{Math.floor(Math.random() * 1000) + 100}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="mr-2 h-4 w-4" />
                Add New Product
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Plus className="mr-2 h-4 w-4" />
                Create Discount
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Plus className="mr-2 h-4 w-4" />
                Send Notification
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Plus className="mr-2 h-4 w-4" />
                Generate Report
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
