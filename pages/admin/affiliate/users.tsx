import { useEffect, useState } from "react";
import {
  Button,
  Table,
  Tag,
  Input,
  Space,
  Card,
  message,
  Modal,
  Descriptions,
  Tabs,
  Statistic,
  Row,
  Col,
  Tooltip,
  Select,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import AdminLayout from "../_layout";
import dayjs from "dayjs";
import {
  EyeOutlined,
  DollarOutlined,
  LinkOutlined,
  UserOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import { formatPrice } from "@/pages/subscription/ui/subscription-plans/pricing";

const { TabPane } = Tabs;
const { Option } = Select;

interface AffiliateUser {
  id: string;
  userId: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  customLink?: string;
  emailNotifications: boolean;
  stats?: {
    totalLinks: number;
    totalVisits: number;
    totalConversions: number;
    totalCommissions: number;
    pendingCommissions: number;
  };
}

interface AffiliateDetail {
  affiliate: AffiliateUser;
  links: any[];
  commissions: any[];
  visits: any[];
}

export default function AffiliateUsersPage() {
  const [affiliates, setAffiliates] = useState<AffiliateUser[]>([]);
  const [filteredAffiliates, setFilteredAffiliates] = useState<AffiliateUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAffiliate, setSelectedAffiliate] = useState<AffiliateUser | null>(null);
  const [affiliateDetail, setAffiliateDetail] = useState<AffiliateDetail | null>(null);
  const [customLink, setCustomLink] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    fetchAffiliates();
  }, []);

  useEffect(() => {
    if (affiliates && affiliates.length >= 0) {
      filterAffiliates();
    }
  }, [affiliates, searchText, statusFilter]);

  const filterAffiliates = () => {
    if (!affiliates || !Array.isArray(affiliates)) {
      setFilteredAffiliates([]);
      return;
    }
    let filtered = [...affiliates];

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((a) => a.status === statusFilter);
    }

    // Filter by search text
    if (searchText) {
      filtered = filtered.filter(
        (a) =>
          a.userId.toLowerCase().includes(searchText.toLowerCase()) ||
          a.id.toLowerCase().includes(searchText.toLowerCase()) ||
          (a.customLink && a.customLink.toLowerCase().includes(searchText.toLowerCase()))
      );
    }

    setFilteredAffiliates(filtered);
  };

  const fetchAffiliates = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/affiliate/users");
      const data = await res.json();

      if (data.success) {
        setAffiliates(data.affiliates);
        setFilteredAffiliates(data.affiliates);
      } else {
        message.error("Không thể tải danh sách affiliate");
      }
    } catch (error) {
      message.error("Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  const fetchAffiliateDetail = async (affiliateId: string) => {
    try {
      const res = await fetch(`/api/admin/affiliate/detail?affiliateId=${affiliateId}`);
      const data = await res.json();

      if (data.success && data.affiliate) {
        setAffiliateDetail({
          affiliate: data.affiliate,
          links: Array.isArray(data.links) ? data.links : [],
          commissions: Array.isArray(data.commissions) ? data.commissions : [],
          visits: Array.isArray(data.visits) ? data.visits : [],
        });
        setDetailModalVisible(true);
      } else {
        message.error("Không thể tải thông tin chi tiết");
      }
    } catch (error) {
      console.error("Error fetching affiliate detail:", error);
      message.error("Có lỗi xảy ra");
    }
  };

  const handleApprove = async (affiliate: AffiliateUser) => {
    setSelectedAffiliate(affiliate);
    setCustomLink(affiliate.customLink || "");
    setModalVisible(true);
  };

  const handleConfirmApprove = async () => {
    if (!selectedAffiliate) return;

    try {
      const res = await fetch("/api/admin/affiliate/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          affiliateId: selectedAffiliate.id,
          customLink: customLink || undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        message.success("Đã duyệt affiliate thành công");
        setModalVisible(false);
        fetchAffiliates();
      } else {
        message.error(data.error || "Duyệt thất bại");
      }
    } catch (error) {
      message.error("Có lỗi xảy ra");
    }
  };

  const handleReject = async (affiliate: AffiliateUser) => {
    Modal.confirm({
      title: "Xác nhận từ chối",
      content: "Bạn có chắc chắn muốn từ chối affiliate này?",
      onOk: async () => {
        try {
          const res = await fetch("/api/admin/affiliate/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "reject",
              affiliateId: affiliate.id,
            }),
          });

          const data = await res.json();

          if (data.success) {
            message.success("Đã từ chối affiliate");
            fetchAffiliates();
          } else {
            message.error(data.error || "Từ chối thất bại");
          }
        } catch (error) {
          message.error("Có lỗi xảy ra");
        }
      },
    });
  };

  const columns: ColumnsType<AffiliateUser> = [
    {
      title: "User ID",
      dataIndex: "userId",
      key: "userId",
      width: 150,
      render: (userId: string) => (
        <Tooltip title={userId}>
          <span className="font-mono text-xs">{userId.substring(0, 12)}...</span>
        </Tooltip>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: string) => {
        const colors: Record<string, string> = {
          pending: "orange",
          approved: "green",
          rejected: "red",
        };
        const labels: Record<string, string> = {
          pending: "Chờ duyệt",
          approved: "Đã duyệt",
          rejected: "Đã từ chối",
        };
        return <Tag color={colors[status]}>{labels[status]}</Tag>;
      },
    },
    {
      title: "Thống kê",
      key: "stats",
      width: 200,
      render: (_: any, record: AffiliateUser) => {
        if (!record.stats) return "-";
        return (
          <div className="text-xs space-y-1">
            <div>Links: <strong>{record.stats.totalLinks}</strong></div>
            <div>Visits: <strong>{record.stats.totalVisits}</strong></div>
            <div>Hoa hồng: <strong className="text-green-600">{formatPrice(record.stats.totalCommissions)}</strong></div>
          </div>
        );
      },
    },
    {
      title: "Ngày đăng ký",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 150,
      render: (date: string) => dayjs(date).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Ngày duyệt",
      dataIndex: "approvedAt",
      key: "approvedAt",
      width: 150,
      render: (date?: string) => date ? dayjs(date).format("DD/MM/YYYY HH:mm") : "-",
    },
    {
      title: "Hành động",
      key: "action",
      width: 200,
      render: (_: any, record: AffiliateUser) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => fetchAffiliateDetail(record.id)}
          >
            Chi tiết
          </Button>
          {record.status === "pending" && (
            <>
              <Button
                type="primary"
                size="small"
                onClick={() => handleApprove(record)}
              >
                Duyệt
              </Button>
              <Button
                danger
                size="small"
                onClick={() => handleReject(record)}
              >
                Từ chối
              </Button>
            </>
          )}
          {record.status === "approved" && (
            <Button
              size="small"
              onClick={() => {
                setSelectedAffiliate(record);
                setCustomLink(record.customLink || "");
                setModalVisible(true);
              }}
            >
              Sửa
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout>
      <Card
        title={
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold m-0">Quản lý Affiliate Users</h1>
            <div className="text-sm text-gray-500">
              Tổng số: <strong className="text-gray-900">{filteredAffiliates?.length || 0}</strong>
            </div>
          </div>
        }
        extra={
          <Space>
            <Input
              placeholder="Tìm kiếm User ID, Affiliate ID..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 250 }}
              allowClear
            />
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              style={{ width: 150 }}
            >
              <Option value="all">Tất cả</Option>
              <Option value="pending">Chờ duyệt</Option>
              <Option value="approved">Đã duyệt</Option>
              <Option value="rejected">Đã từ chối</Option>
            </Select>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={filteredAffiliates}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 20, showSizeChanger: true }}
          scroll={{ x: 1000 }}
        />

        {/* Modal for Approve/Edit */}
        <Modal
          title={selectedAffiliate?.status === "approved" ? "Cập nhật affiliate" : "Duyệt affiliate"}
          open={modalVisible}
          onOk={handleConfirmApprove}
          onCancel={() => setModalVisible(false)}
          okText="Xác nhận"
          cancelText="Hủy"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Link tùy chỉnh (tùy chọn)
              </label>
              <Input
                placeholder="vd: mylink"
                value={customLink}
                onChange={(e) => setCustomLink(e.target.value)}
                addonBefore="ref="
              />
              <p className="text-xs text-gray-500 mt-1">
                Nếu để trống, hệ thống sẽ tự động tạo link
              </p>
            </div>
          </div>
        </Modal>

        {/* Modal for Detail */}
        <Modal
          title={
            <div className="flex items-center gap-2">
              <UserOutlined />
              <span>Chi tiết Affiliate</span>
            </div>
          }
          open={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          footer={null}
          width={900}
        >
          {affiliateDetail && affiliateDetail.affiliate && (
            <div>
              <Tabs defaultActiveKey="info">
                <TabPane
                  tab={
                    <span className="flex items-center gap-2">
                      <UserOutlined />
                      Thông tin
                    </span>
                  }
                  key="info"
                >
                  <Descriptions bordered column={2}>
                    <Descriptions.Item label="Affiliate ID">
                      <span className="font-mono text-xs">{affiliateDetail.affiliate.id}</span>
                    </Descriptions.Item>
                    <Descriptions.Item label="User ID">
                      <span className="font-mono text-xs">{affiliateDetail.affiliate.userId}</span>
                    </Descriptions.Item>
                    <Descriptions.Item label="Trạng thái">
                      <Tag
                        color={
                          affiliateDetail.affiliate.status === "approved"
                            ? "green"
                            : affiliateDetail.affiliate.status === "pending"
                            ? "orange"
                            : "red"
                        }
                      >
                        {affiliateDetail.affiliate.status === "approved"
                          ? "Đã duyệt"
                          : affiliateDetail.affiliate.status === "pending"
                          ? "Chờ duyệt"
                          : "Đã từ chối"}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Email Notifications">
                      {affiliateDetail.affiliate.emailNotifications ? "Bật" : "Tắt"}
                    </Descriptions.Item>
                    <Descriptions.Item label="Ngày đăng ký">
                      {dayjs(affiliateDetail.affiliate.createdAt).format("DD/MM/YYYY HH:mm:ss")}
                    </Descriptions.Item>
                    <Descriptions.Item label="Ngày duyệt">
                      {affiliateDetail.affiliate.approvedAt
                        ? dayjs(affiliateDetail.affiliate.approvedAt).format("DD/MM/YYYY HH:mm:ss")
                        : "-"}
                    </Descriptions.Item>
                  </Descriptions>

                  <Row gutter={16} className="mt-6">
                    <Col span={6}>
                      <Statistic
                        title="Tổng Links"
                        value={affiliateDetail.affiliate.stats?.totalLinks || 0}
                        prefix={<LinkOutlined />}
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic
                        title="Tổng Visits"
                        value={affiliateDetail.affiliate.stats?.totalVisits || 0}
                        prefix={<EyeOutlined />}
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic
                        title="Tổng Conversions"
                        value={affiliateDetail.affiliate.stats?.totalConversions || 0}
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic
                        title="Tổng Hoa hồng"
                        value={affiliateDetail.affiliate.stats?.totalCommissions || 0}
                        prefix="₫"
                        valueStyle={{ color: "#3f8600" }}
                      />
                    </Col>
                  </Row>
                </TabPane>

                <TabPane
                  tab={
                    <span className="flex items-center gap-2">
                      <LinkOutlined />
                      Links ({affiliateDetail.links?.length || 0})
                    </span>
                  }
                  key="links"
                >
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {!affiliateDetail.links || affiliateDetail.links.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">Chưa có link nào</p>
                    ) : (
                      affiliateDetail.links.map((link: any) => (
                        <div
                          key={link.id}
                          className="p-3 bg-gray-50 rounded border border-gray-200"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-semibold text-sm">
                                {link.customLink ? `Custom: ${link.customLink}` : "Default"}
                              </div>
                              <div className="text-xs text-gray-600 font-mono break-all">
                                {link.link}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {dayjs(link.createdAt).format("DD/MM/YYYY HH:mm")}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </TabPane>

                <TabPane
                  tab={
                    <span className="flex items-center gap-2">
                      <DollarOutlined />
                      Commissions ({affiliateDetail.commissions?.length || 0})
                    </span>
                  }
                  key="commissions"
                >
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {!affiliateDetail.commissions || affiliateDetail.commissions.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">Chưa có commission nào</p>
                    ) : (
                      affiliateDetail.commissions.map((commission: any) => (
                        <div
                          key={commission.id}
                          className="p-3 bg-gray-50 rounded border border-gray-200"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-semibold text-sm">
                                Order: #{commission.orderId.substring(0, 12)}...
                              </div>
                              <div className="text-xs text-gray-600">
                                Amount: {formatPrice(commission.amount)} | Commission:{" "}
                                <strong className="text-green-600">
                                  {formatPrice(commission.commissionAmount)}
                                </strong>
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {dayjs(commission.createdAt).format("DD/MM/YYYY HH:mm")} |{" "}
                                <Tag
                                  color={
                                    commission.status === "paid"
                                      ? "green"
                                      : commission.status === "pending"
                                      ? "orange"
                                      : "red"
                                  }
                                  className="text-xs"
                                >
                                  {commission.status === "paid"
                                    ? "Đã thanh toán"
                                    : commission.status === "pending"
                                    ? "Chờ thanh toán"
                                    : "Đã hủy"}
                                </Tag>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </TabPane>
              </Tabs>
            </div>
          )}
        </Modal>
      </Card>
    </AdminLayout>
  );
}
