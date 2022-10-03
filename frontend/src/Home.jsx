import {useCallback, useEffect, useState} from 'react';
import {Badge, Button, Col, Drawer, Input, List, message, Modal, Row, Space, Tooltip, Typography} from 'antd';
import {
    BellOutlined,
    CopyOutlined,
    FileTextTwoTone,
    FileTwoTone,
    QrcodeOutlined,
    SelectOutlined,
    SendOutlined,
    SettingOutlined,
} from '@ant-design/icons';
import {GetDefaultDir, OpenDirectoryDialog, OpenFileDir, OpenFilesDialog} from "../wailsjs/go/main/App";
import {EventsEmit, EventsOff, EventsOn} from "../wailsjs/runtime";
import Login from "./Login";
import {CopyToClipboard} from "react-copy-to-clipboard/src";

const {Title, Paragraph} = Typography;
const {TextArea} = Input;

const MsgType = {
    Text: 0,
    File: 1
}

function Home() {
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [qrCodeModalVisible, setQRCodeModalVisible] = useState(false);
    const [sendTextModalVisible, setSendTextModalVisible] = useState(false);
    const [path, setSavePath] = useState('');
    const [text, setText] = useState('');
    const [onlineNum, setOnlineNum] = useState(0);
    const [messages, setMessages] = useState([])
    const [redDotNum, setRedDotNum] = useState(0)

    // 首次打开
    useEffect(() => {
        if (!onlineNum) {
            setQRCodeModalVisible(true)
        }
    }, [])

    // 监听Notice时间
    useEffect(() => {
        EventsOn("Cmd_Notice", (data) => {
            if (!data) return

            console.log(data)
            if (data.mType === MsgType.File) {
                const fileMsgs = data.files?.map((f) => {
                    return {
                        mType: data.mType,
                        title: data.title,
                        file: f
                    }
                })

                setRedDotNum(redDotNum + fileMsgs.length)
                setMessages([...fileMsgs, ...messages])
            } else {
                setRedDotNum(redDotNum + 1)
                setMessages([{
                    mType: data.mType,
                    title: data.title,
                    content: data.content
                }, ...messages])
            }
        })

        return () => {
            EventsOff("Cmd_Notice")
        }
    }, [redDotNum, messages])

    // 获取默认路径
    useEffect(() => {
        (async () => {
            const p = await GetDefaultDir()

            setSavePath(p)
        })()
    }, [])

    // 发送消息
    const send = useCallback(() => {
        if (!text) {
            return
        }

        EventsEmit("Cmd_Send_Text", text)

        message.info("已发送", 1).then(() => {
        })

        setText('')
        setSendTextModalVisible(false)
    }, [text])

    // 选择路径
    const openSavePathDialog = useCallback(() => {
        (async () => {
            const p = await OpenDirectoryDialog()

            if (p) {
                setSavePath(p)
            }
        })()
    }, [])

    // 选择文件并发送
    const openFilesDialog = useCallback(() => {
        (async () => {
            await OpenFilesDialog()

            message.info("已发送", 1).then(() => {
            })
        })()
    }, [])

    // 打开文件路径
    const OpenFileDirDialog = useCallback((filePath) => {
        (async () => {
            await OpenFileDir(filePath)
        })()
    }, [])

    // 扫码回调
    const scanCallback = useCallback((num) => {
        setOnlineNum(num)

        setQRCodeModalVisible(false)
    }, [])

    const renderMessages = useCallback(() => {
        return (
            <List
                locale={{emptyText: '暂无数据'}}
                dataSource={messages}
                renderItem={item => {
                    switch (item.mType) {
                        case MsgType.Text:
                            return (
                                <List.Item key={item.content} className="message-item"
                                           actions={[
                                               <Button onClick={() => {
                                                   Modal.info({
                                                       maskClosable: true,
                                                       icon: null,
                                                       okText: "关闭",
                                                       title: <div style={{textAlign: "left"}}>
                                                           <span style={{marginRight: "10px"}}>{item.title}</span>

                                                           <CopyToClipboard text={item.content}>
                                                               <Button onClick={() => {
                                                                   message.info("Copied!", 1).then(() => {
                                                                   })
                                                               }} size="small" type="primary" icon={<CopyOutlined/>}/>
                                                           </CopyToClipboard>
                                                       </div>,
                                                       content: (
                                                           <div style={{textAlign: "left"}}>
                                                               {item.content}
                                                           </div>
                                                       ),
                                                   });
                                               }} size="small" type="primary">查看</Button>

                                           ]}>
                                    <List.Item.Meta
                                        className="message-item-meta"
                                        style={{textAlign: "left"}}
                                        avatar={<FileTextTwoTone style={{fontSize: "36px"}}/>}
                                        title={<Paragraph ellipsis>{item.title}</Paragraph>}
                                        description={
                                            <Paragraph ellipsis>
                                                {item.content}
                                            </Paragraph>
                                        }
                                    />
                                </List.Item>
                            )
                        case MsgType.File:
                            return (
                                item.file && <List.Item key={item.file.fileID} className="message-item"
                                                        actions={[<Button
                                                            onClick={() => OpenFileDirDialog(item.file.filePath || "")}
                                                            size="small" type="primary">打开</Button>]}>
                                    <List.Item.Meta
                                        className="message-item-meta"
                                        style={{textAlign: "left"}}
                                        avatar={<FileTwoTone style={{fontSize: "36px"}}/>}
                                        title={<Paragraph ellipsis>{item.title}</Paragraph>}
                                        description={
                                            <Paragraph ellipsis>
                                                <Tooltip title={item.file.filename}>
                                                    {item.file.filename}
                                                </Tooltip>
                                            </Paragraph>
                                        }
                                    />
                                </List.Item>
                            )
                        default:
                            return null
                    }
                }

                }
            />
        )
    }, [messages])

    return (
        <>
            <Space
                direction="vertical"
                size={30}
                style={{display: 'flex', position: "relative", top: "38%", transform: "translateY(-50%)"}}
            >
                <Title level={3}>连接设备：{onlineNum} 台</Title>

                <Row>
                    <Col offset={4} span={16}>
                        <Input.Group compact>
                            <Input style={{width: 'calc(100% - 140px)'}} title={path} disabled value={path}/>

                            <Button type="primary" onClick={openSavePathDialog}
                                    icon={<SettingOutlined/>}>保存路径</Button>
                        </Input.Group>
                    </Col>
                </Row>

                <Row>
                    <Col offset={6} span={4}>
                        <Button style={{height: "50px"}} size="large" type="primary" icon={<SendOutlined/>}
                                onClick={() => setSendTextModalVisible(true)} block>
                            发送文本
                        </Button>
                    </Col>

                    <Col offset={4} span={4}>
                        <Button style={{height: "50px"}} size="large" onClick={openFilesDialog} type="primary"
                                icon={<SelectOutlined/>} block>
                            发送文件
                        </Button>
                    </Col>

                </Row>
            </Space>

            {/*发送文本弹窗*/}
            <Modal closable={false} footer={null} visible={sendTextModalVisible}
                   onCancel={() => setSendTextModalVisible(false)}>
                <Space direction="vertical" size={30} style={{display: "flex"}}>
                    <TextArea rows={10} placeholder="请输入..." onChange={(evt) => setText(evt.target.value)}
                              value={text}
                              maxLength={1000} showCount/>

                    <Button disabled={!text} size="large" onClick={send} type="primary"
                            icon={<SendOutlined/>} block>
                        发送
                    </Button>
                </Space>
            </Modal>

            {/*打开消息中心*/}
            <div style={{position: 'absolute', bottom: '8%', right: '8%'}}>
                <Badge count={redDotNum} offset={[-5, 5]}>
                    <Button size="large" shape="circle" onClick={() => {
                        setDrawerVisible(true)
                        setRedDotNum(0)
                    }} icon={<BellOutlined/>}/>
                </Badge>
            </div>

            {/*消息中心列表*/}
            <Drawer width="60%" closable={false} title="消息" onClose={() => {
                setDrawerVisible(false)
                setRedDotNum(0)
            }} visible={drawerVisible}>
                {renderMessages()}
            </Drawer>

            {/*打开扫码登录弹窗*/}
            <div style={{position: 'absolute', bottom: '8%', left: '8%'}}>
                <Button size="large" shape="circle" onClick={() => {
                    setQRCodeModalVisible(true)
                }} icon={<QrcodeOutlined/>}/>
            </div>

            {/*扫码登录弹窗*/}
            <Modal closable={false} footer={null} visible={qrCodeModalVisible}
                   onCancel={() => setQRCodeModalVisible(false)}>
                <Login scanCallback={scanCallback}/>
            </Modal>
        </>
    );
}

export default Home;
