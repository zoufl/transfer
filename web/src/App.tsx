import './App.css'
import {
    Badge,
    Button,
    CenterPopup,
    Dialog,
    Divider,
    Ellipsis,
    Empty,
    FloatingBubble,
    List,
    Popup,
    Space,
    Tag,
    TextArea,
    Toast
} from 'antd-mobile'
import {useCallback, useEffect, useRef, useState} from "react";
import {DownlandOutline, MessageFill, MessageOutline} from 'antd-mobile-icons';
import {getWebSocket} from './websocket';
import http from "./http";

enum MsgType {
    Text = 0,
    File = 1
}

interface WsResponse {
    mType: MsgType
    content: string
    files: MyFile[]
}

interface Msg {
    mType: MsgType
    content: string | null
    file: MyFile | null
}

interface MyFile {
    fileID: string
    filename: string
}

function App() {
    const ws = useRef<WebSocket>()
    const inputEl = useRef<HTMLInputElement>(null)
    const [content, setContent] = useState('')
    const [isConnect, setConnectFlag] = useState(false)
    // const [isTextLoading, setTextLoading] = useState(false)
    const [isFileLoading, setFileLoading] = useState(false)
    const [canShowRedDot, setShowRedDot] = useState(false)
    const [isTextPopupVisible, setTextPopupVisible] = useState(false)
    const [isMsgPopupVisible, setMsgPopupVisible] = useState(false)
    const [messages, setMessages] = useState<Msg[]>([])

    function createWebSocket() {
        ws.current = getWebSocket()

        ws.current.onopen = () => {
            console.log("已连接")

            setConnectFlag(true)
        }

        ws.current.onclose = () => {
            console.log("已关闭")

            setConnectFlag(false)
        }

        ws.current.onerror = () => {
            console.error("websocket 错误")

            setConnectFlag(false)
        }
    }

    // websocket连接
    useEffect(() => {
        createWebSocket()

        // document.addEventListener('visibilitychange', () => {
        //     console.log("屏幕： ", document.hidden)
        //     if (!document.hidden) {
        //         if (ws.current?.readyState === 2 || ws.current?.readyState === 3) {
        //             createWebSocket()
        //         }
        //     }
        // })
    }, []);

    // onmessage时间
    useEffect(() => {
        if (!isConnect) return

        if (ws.current) {
            ws.current.onmessage = (event) => {
                console.log(event, event.data)

                if (event?.data) {
                    const data: WsResponse = JSON.parse(event.data)

                    if (data.mType == MsgType.File) {
                        const fileMsgs = data.files?.map((file) => {
                            return {
                                mType: data.mType,
                                content: null,
                                file: file
                            }
                        })

                        setMessages([...fileMsgs, ...messages])
                    } else {
                        setMessages([{
                            mType: data.mType,
                            content: data.content,
                            file: null
                        }, ...messages])
                    }

                    setShowRedDot(true)
                }
            }
        }
    }, [isConnect, messages])

    // 打开发送文本框
    const openTextPopup = useCallback(() => {
        if (!isConnect) {
            Toast.show("未连接")

            return
        }

        setTextPopupVisible(true)
    }, [isConnect])

    // 打开上传文件框
    const openFileDialog = useCallback(() => {
        if (!isConnect) {
            Toast.show("未连接")

            return
        }

        inputEl?.current?.click()
    }, [isConnect])

    // 发送文本
    const send = useCallback(() => {
        if (!content) {
            return
        }

        // setTextLoading(true)

        ws.current?.send(content)

        Toast.show("已发送")

        setTextPopupVisible(false)
        setContent('')
    }, [content])

    // 上传文件
    const handleFileChange = useCallback((event: any) => {
        (async () => {
            if (event?.target?.files?.length > 0) {
                const files = event.target.files || []
                const formData = new FormData()

                for (let i = 0; i < files.length; i++) {
                    formData.append('files', files[i])
                }

                setFileLoading(true)
                await http.post(`upload`, formData, {
                    // onUploadProgress: progressEvent => {
                    //     console.log(progressEvent)
                    // }
                }).then(() => {
                    Toast.show("已上传")

                    setFileLoading(false)
                }).catch(() => {
                    setFileLoading(false)
                })
            }

        })()
    }, [])

    // 下载文件
    const downloadFile = useCallback((file?: MyFile | null) => {
        if (!file || !file.fileID) {
            return
        }

        (async () => {
            let res = await http.post(`download?fid=${file.fileID}`, null, {responseType: "blob"})

            const b = new Blob([res.data])

            const aLink = document.createElement("a");

            const objectUrl = URL.createObjectURL(b);
            aLink.href = objectUrl;
            aLink.download = file.filename;
            document.body.appendChild(aLink);

            aLink.click();
            document.body.removeChild(aLink);

            URL.revokeObjectURL(objectUrl);

            Toast.show("已下载")
        })()
    }, [])

    // 渲染消息列表项
    const renderMessages = useCallback(() => {
        if (messages?.length == 0) {
            return <Empty description='暂无数据'/>
        }

        return (
            messages?.map((msg) => {
                switch (msg.mType) {
                    case MsgType.Text:
                        return (<List.Item key={msg.content}
                                           prefix={<MessageOutline fontSize={28} color='var(--adm-color-primary)'/>}
                                           extra={<Button size="mini" onClick={() => {
                                               Dialog.alert({
                                                   content: <div style={{wordBreak: 'break-word'}}>{msg.content}</div>,
                                                   closeOnMaskClick: true,
                                               })
                                           }} color="primary">查看</Button>}>
                            <div style={{wordBreak: 'break-word'}}><Ellipsis content={msg.content || ''}/></div>
                        </List.Item>)
                    case MsgType.File:
                        return <List.Item key={msg.file?.fileID}
                                          prefix={<DownlandOutline fontSize={28} color='var(--adm-color-primary)'/>}
                                          extra={<Button onClick={() => downloadFile(msg.file)} size="mini"
                                                         color="success">下载</Button>}>
                            <div style={{wordBreak: 'break-word'}}><Ellipsis content={msg.file?.filename || ''}/></div>
                        </List.Item>
                    default:
                        return null
                }
            })
        )
    }, [messages])

    return (
        <>
            <Space style={{'--gap': '38px', height: "100%"}} direction='vertical' justify='center' block>
                <Divider
                    style={isConnect ? {
                        color: '#1677ff',
                        borderColor: '#1677ff',
                        borderStyle: 'dashed',
                        marginBottom: "25px"
                    } : {marginBottom: "25px"}}
                >
                    <Tag color={isConnect ? 'primary' : 'default'}>{isConnect ? '已连接' : '未连接'}</Tag>
                </Divider>

                <div className="action-btn-group" style={{margin: "0 20px"}}>
                    <Button onClick={() => openTextPopup()}
                            block
                            color='primary'
                            size='large'>
                        发送文本
                    </Button>
                </div>

                <div className="action-btn-group" style={{margin: "0 20px"}}>
                    <Button block
                            disabled={isFileLoading}
                            loading={isFileLoading}
                            loadingText="上传中"
                            onClick={() => openFileDialog()}
                            color='success' size='large'>
                        上传文件
                    </Button>

                    <input multiple onChange={handleFileChange} ref={inputEl} style={{display: 'none'}} type="file"/>
                </div>
            </Space>

            {/*发送文本*/}
            <CenterPopup
                visible={isTextPopupVisible}
                onMaskClick={() => {
                    setTextPopupVisible(false)
                }}
            >
                <Space block direction='vertical' style={{'--gap': '20px', padding: "10px"}}>
                    <TextArea
                        className="send-text-box"
                        onChange={val => {
                            setContent(val)
                        }}
                        placeholder='请输入内容'
                        value={content}
                        rows={10}
                        showCount
                        maxLength={1000}
                    />

                    <Button block
                            disabled={!content}
                        // loading={isTextLoading}
                        // loadingText="发送中"
                            onClick={send}
                            color='primary'>
                        发送
                    </Button>
                </Space>
            </CenterPopup>

            {/*消息中心*/}
            <FloatingBubble
                style={{
                    '--initial-position-bottom': '30px',
                    '--initial-position-right': '30px',
                    '--edge-distance': '30px',
                }}
                axis='x'
                magnetic='x'
                onClick={() => {
                    setMsgPopupVisible(true)
                    setShowRedDot(false)
                }}
            >
                <Badge content={(canShowRedDot && (messages?.length > 0)) ? Badge.dot : null}
                       style={{"--right": "5px", "--top": "5px"}}>
                    <MessageFill fontSize={32}/>
                </Badge>
            </FloatingBubble>

            {/*消息弹层*/}
            <Popup
                visible={isMsgPopupVisible}
                closeOnMaskClick={true}
                position='left'
                onMaskClick={() => {
                    setMsgPopupVisible(false)
                    setShowRedDot(false)
                }}
                bodyStyle={{width: '68vw'}}
            >
                <List header='消息列表'>
                    {
                        renderMessages()
                    }
                </List>
            </Popup>
        </>
    )
}

export default App
