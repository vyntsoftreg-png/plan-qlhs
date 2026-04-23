import React, { useEffect, useState, useCallback } from 'react';
import {
  Table, Button, Modal, Form, Input, Select, Space, Popconfirm, Upload,
  message, Card, Row, Col, Typography, Divider, Image, Spin,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined,
  MinusCircleOutlined, UploadOutlined, CopyOutlined, ThunderboltOutlined,
} from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchTemplates, createTemplate, updateTemplate, deleteTemplate,
} from '../../redux/slices/templatesSlice';
import api from '../../api/axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

export default function TemplatesPage() {
  const dispatch = useDispatch();
  const { list, pagination, loading } = useSelector(state => state.templates);
  const { user } = useSelector(state => state.auth);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [, forceUpdate] = useState(0);
  // skills data for selection
  const [allSkills, setAllSkills] = useState([]);
  const [skillsLoading, setSkillsLoading] = useState(false);

  const loadData = (page = 1) => {
    dispatch(fetchTemplates({ page, limit: 10, kindergarten_id: user?.kindergarten_id }));
  };

  const loadAllSkills = useCallback(async () => {
    setSkillsLoading(true);
    try {
      const res = await api.get('/skills?limit=200&offset=0');
      if (res.data.code === 'SUCCESS') {
        // Load full details (with goals) for each skill
        const skillIds = res.data.data.map(s => s.id);
        const detailed = await Promise.all(
          skillIds.map(id => api.get(`/skills/${id}`).then(r => r.data.data).catch(() => null))
        );
        setAllSkills(detailed.filter(Boolean));
      }
    } catch { /* ignore */ }
    setSkillsLoading(false);
  }, []);

  useEffect(() => { loadData(1); loadAllSkills(); }, []);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ skills: [{ skill_id: undefined, goals: [{ section_name: '', goal_title: '', activities: '' }] }] });
    setModalOpen(true);
  };

  const openEdit = async (record) => {
    setEditing(record);
    try {
      const res = await api.get(`/templates/${record.id}`);
      const tmpl = res.data.data;
      // Group goals by skill_name
      const skillMap = {};
      const skillOrder = [];
      (tmpl.goals || []).forEach(g => {
        if (!skillMap[g.skill_name]) {
          skillMap[g.skill_name] = [];
          skillOrder.push(g.skill_name);
        }
        skillMap[g.skill_name].push({
          section_name: g.section_name || '',
          goal_title: g.goal_title,
          activities: g.activities || '',
          image_url: g.image_url || '',
        });
      });
      // Match skill_name to skill_id
      const skills = skillOrder.map(sn => {
        const matched = allSkills.find(s => s.name === sn);
        return {
          skill_id: matched ? matched.id : undefined,
          skill_name_text: matched ? undefined : sn,
          goals: skillMap[sn],
        };
      });
      form.setFieldsValue({
        name: tmpl.name,
        description: tmpl.description || '',
        age_group: tmpl.age_group || '',
        skills: skills.length > 0 ? skills : [{ skill_id: undefined, goals: [{ section_name: '', goal_title: '', activities: '' }] }],
      });
      setModalOpen(true);
    } catch {
      message.error('Không tải được mẫu kế hoạch');
    }
  };

  const handleSkillSelect = (skillId, skillFieldName) => {
    const skill = allSkills.find(s => s.id === skillId);
    if (!skill) return;
    const skills = form.getFieldValue('skills');
    skills[skillFieldName].goals = (skill.goals && skill.goals.length > 0)
      ? skill.goals.map(g => ({ section_name: g.section_name || '', goal_title: g.goal_title, activities: g.activities || '', image_url: '' }))
      : [{ section_name: '', goal_title: '', activities: '', image_url: '' }];
    form.setFieldsValue({ skills: [...skills] });
    forceUpdate(n => n + 1);
  };

  const handleUpload = async (file, skillIdx, goalIdx) => {
    const formData = new FormData();
    formData.append('image', file);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.code === 'SUCCESS') {
        const skills = form.getFieldValue('skills');
        skills[skillIdx].goals[goalIdx].image_url = data.data.url;
        form.setFieldsValue({ skills: [...skills] });
        forceUpdate(n => n + 1);
        message.success('Tải ảnh thành công');
      } else {
        message.error('Tải ảnh thất bại');
      }
    } catch {
      message.error('Tải ảnh thất bại');
    }
    return false;
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      // Flatten skills → goals array
      const goals = [];
      (values.skills || []).forEach(skill => {
        const skillObj = allSkills.find(s => s.id === skill.skill_id);
        const skillName = skillObj ? skillObj.name : (skill.skill_name_text || '');
        (skill.goals || []).forEach(goal => {
          goals.push({
            skill_name: skillName,
            section_name: goal.section_name || '',
            goal_title: goal.goal_title,
            activities: goal.activities || '',
            image_url: goal.image_url || '',
          });
        });
      });

      const payload = {
        name: values.name,
        description: values.description || '',
        age_group: values.age_group || '',
        goals,
      };

      if (editing) {
        await dispatch(updateTemplate({ id: editing.id, data: payload })).unwrap();
        message.success('Cập nhật mẫu kế hoạch thành công');
      } else {
        await dispatch(createTemplate(payload)).unwrap();
        message.success('Tạo mẫu kế hoạch thành công');
      }
      setModalOpen(false);
      loadData(currentPage);
    } catch (err) {
      if (err?.message) message.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await dispatch(deleteTemplate(id)).unwrap();
      message.success('Xóa mẫu kế hoạch thành công');
      loadData(currentPage);
    } catch (err) {
      message.error(err?.message || 'Xóa thất bại');
    }
  };

  const handleClone = async (id) => {
    try {
      const res = await api.post(`/templates/${id}/clone`);
      if (res.data.code === 'SUCCESS') {
        message.success('Sao chép mẫu kế hoạch thành công');
        loadData(currentPage);
      }
    } catch (err) {
      message.error(err?.response?.data?.message || 'Sao chép thất bại');
    }
  };

  const columns = [
    { title: 'Tên mẫu', dataIndex: 'name', key: 'name' },
    { title: 'Mô tả', dataIndex: 'description', key: 'description', ellipsis: true, render: v => v || '—' },
    { title: 'Nhóm tuổi', dataIndex: 'age_group', key: 'age_group', render: v => v || '—' },
    { title: 'Số mục tiêu', key: 'goal_count', render: (_, r) => r.goal_count ?? '—' },
    { title: 'Người tạo', dataIndex: 'creator_name', key: 'creator_name', render: v => v || '—' },
    {
      title: 'Thao tác', key: 'actions', width: 160,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Button size="small" icon={<CopyOutlined />} title="Sao chép" onClick={() => handleClone(record.id)} />
          <Popconfirm title="Xác nhận xóa?" onConfirm={() => handleDelete(record.id)} okText="Xóa" cancelText="Hủy">
            <Button size="small" icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Card
        title="Quản lý mẫu kế hoạch"
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>Tạo mẫu mới</Button>}
      >
        <Row gutter={8} style={{ marginBottom: 16 }}>
          <Col flex="auto">
            <Input
              placeholder="Tìm kiếm mẫu kế hoạch..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onPressEnter={() => { setCurrentPage(1); loadData(1); }}
              prefix={<SearchOutlined />}
              allowClear
            />
          </Col>
          <Col>
            <Button type="primary" onClick={() => { setCurrentPage(1); loadData(1); }}>Tìm kiếm</Button>
          </Col>
        </Row>
        <Table
          rowKey="id"
          dataSource={list}
          columns={columns}
          loading={loading}
          pagination={{
            current: currentPage,
            pageSize: 10,
            total: pagination?.total || 0,
            showTotal: t => `Tổng ${t} mẫu`,
          }}
          onChange={pag => { setCurrentPage(pag.current); loadData(pag.current); }}
        />
      </Card>

      <Modal
        title={editing ? 'Chỉnh sửa mẫu kế hoạch' : 'Tạo mẫu kế hoạch mới'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        okText={editing ? 'Cập nhật' : 'Tạo'}
        cancelText="Hủy"
        width={900}
        confirmLoading={submitting}
        styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
      >
        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="name" label="Tên mẫu" rules={[{ required: true, message: 'Nhập tên mẫu' }]}>
                <Input placeholder="VD: Kế hoạch tháng 9 - Nhà trẻ" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="age_group" label="Nhóm tuổi">
                <Input placeholder="VD: 3-4 tuổi" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={2} placeholder="Mô tả ngắn" />
          </Form.Item>

          <Divider>Kỹ năng &amp; Mục tiêu</Divider>
          {skillsLoading && <Spin size="small" style={{ marginBottom: 8 }} />}

          <Form.List name="skills">
            {(skillFields, { add: addSkill, remove: removeSkill }) => (
              <div>
                {skillFields.map((skillField) => (
                  <Card
                    key={skillField.key}
                    size="small"
                    style={{ marginBottom: 16, background: '#fafafa' }}
                    title={
                      <Row gutter={8} align="middle">
                        <Col flex="auto">
                          <Form.Item
                            name={[skillField.name, 'skill_id']}
                            rules={[{ required: true, message: 'Chọn kỹ năng' }]}
                            style={{ marginBottom: 0 }}
                          >
                            <Select
                              placeholder="Chọn kỹ năng từ danh sách"
                              showSearch
                              optionFilterProp="children"
                              onChange={(val) => handleSkillSelect(val, skillField.name)}
                              suffixIcon={<ThunderboltOutlined />}
                            >
                              {allSkills.map(s => (
                                <Select.Option key={s.id} value={s.id}>
                                  {s.name} {s.development_area_name ? `(${s.development_area_name})` : ''}
                                </Select.Option>
                              ))}
                            </Select>
                          </Form.Item>
                        </Col>
                      </Row>
                    }
                    extra={
                      skillFields.length > 1 && (
                        <Button type="text" danger icon={<MinusCircleOutlined />} onClick={() => removeSkill(skillField.name)} />
                      )
                    }
                  >
                    <Form.List name={[skillField.name, 'goals']}>
                      {(goalFields, { add: addGoal, remove: removeGoal }) => (
                        <div>
                          {goalFields.map((goalField) => (
                            <div
                              key={goalField.key}
                              style={{ padding: 12, marginBottom: 12, border: '1px dashed #d9d9d9', borderRadius: 6, background: '#fff' }}
                            >
                              <Row gutter={8} align="top">
                                <Col flex="auto">
                                  <Form.Item
                                    name={[goalField.name, 'section_name']}
                                    label="Thêm phần"
                                    style={{ marginBottom: 8 }}
                                  >
                                    <Input placeholder="VD: Phần A: Toán học" />
                                  </Form.Item>
                                  <Form.Item
                                    name={[goalField.name, 'goal_title']}
                                    rules={[{ required: true, message: 'Nhập mục tiêu' }]}
                                    label="Mục tiêu"
                                    style={{ marginBottom: 8 }}
                                  >
                                    <Input placeholder="VD: Ngồi lăn bóng về phía trước" />
                                  </Form.Item>
                                  <Form.Item
                                    name={[goalField.name, 'activities']}
                                    label="Hoạt động"
                                    style={{ marginBottom: 8 }}
                                  >
                                    <Input.TextArea rows={3} placeholder="Mô tả các hoạt động của mục tiêu..." />
                                  </Form.Item>
                                  <Form.Item name={[goalField.name, 'image_url']} hidden>
                                    <Input />
                                  </Form.Item>
                                  <Space>
                                    <Upload
                                      showUploadList={false}
                                      beforeUpload={(file) => handleUpload(file, skillField.name, goalField.name)}
                                      accept="image/*"
                                    >
                                      <Button icon={<UploadOutlined />} size="small">Tải ảnh minh họa</Button>
                                    </Upload>
                                    {(() => {
                                      const skills = form.getFieldValue('skills') || [];
                                      const imgUrl = skills[skillField.name]?.goals?.[goalField.name]?.image_url;
                                      if (imgUrl) {
                                        return <Image src={`http://localhost:5000${imgUrl}`} width={60} height={60} style={{ objectFit: 'cover', borderRadius: 4 }} />;
                                      }
                                      return null;
                                    })()}
                                  </Space>
                                </Col>
                                <Col>
                                  {goalFields.length > 1 && (
                                    <Button type="text" danger icon={<MinusCircleOutlined />} onClick={() => removeGoal(goalField.name)} style={{ marginTop: 30 }} />
                                  )}
                                </Col>
                              </Row>
                            </div>
                          ))}
                          <Button type="dashed" onClick={() => addGoal({ section_name: '', goal_title: '', activities: '', image_url: '' })} block icon={<PlusOutlined />}>
                            Thêm mục tiêu
                          </Button>
                        </div>
                      )}
                    </Form.List>
                  </Card>
                ))}
                <Button
                  type="dashed"
                  onClick={() => addSkill({ skill_id: undefined, goals: [{ section_name: '', goal_title: '', activities: '' }] })}
                  block
                  icon={<PlusOutlined />}
                  style={{ marginBottom: 16 }}
                >
                  Thêm kỹ năng
                </Button>
              </div>
            )}
          </Form.List>
        </Form>
      </Modal>
    </div>
  );
}
