import {useCallback, useEffect, useState} from 'react';
import {EventsOff, EventsOn} from '../wailsjs/runtime';
import {Button, message, Select, Space, Typography} from 'antd';
import {CopyToClipboard} from 'react-copy-to-clipboard/src';
import {CopyOutlined} from '@ant-design/icons';
import {QRCodeSVG} from 'qrcode.react';
import {GetIps, GetServerPort} from "../wailsjs/go/main/App";

const {Option} = Select;
const {Text} = Typography;

function Login(props) {
    const [ips, setIps] = useState([]);
    const [selectedIp, selectIp] = useState('');
    const [disabled, setDisabled] = useState(false);
    const [path, setPath] = useState('');
    const [clients, setClients] = useState(new Set());

    // 监听扫码登录
    useEffect(() => {
        EventsOn("Cmd_Update_Client", (state, data) => {
            if (!data) return

            let num = clients.size + (+state)

            if (num < 0) {
                num = 0
            }
            props?.scanCallback(num)

            if (state > 0) {
                clients.add(data)
                setClients(clients)

                message.success(`${data} 扫码成功!`).then(() => {
                });
            } else {
                clients.delete(data)

                setClients(clients)

                message.warning(`${data} 断开连接!`).then(() => {
                });
            }

            if (clients.size > 0) {
                setDisabled(true)
            } else {
                setDisabled(false)
            }
        })

        return () => {
            EventsOff("Cmd_Update_Client")
        }
    }, [])

    // 获取本地ip
    useEffect(() => {
        (async () => {
            let ips = await GetIps();

            if (ips.length > 0) {
                selectIp(ips[0]);

                makeQRCode(ips[0]);
            }
            setIps(ips);
        })();
    }, []);

    // 处理select
    const handleChange = useCallback((value) => {
        if (value) {
            selectIp(value);

            makeQRCode(value);
        }
    }, [])

    // 更新二维码
    const makeQRCode = useCallback((value) => {
        (async () => {
            let port = await GetServerPort()

            if (!import.meta.env.PROD) {
                port = "5173"
            }

            setPath(`http://${value}:${port}/`);
        })()
    }, [])

    return (<>
        <Space
            direction="vertical"
            size={30}
            style={{display: 'flex'}}
        >
            <Space>
                <Text>选择网络 : </Text>

                {selectedIp && (<Select disabled={disabled} defaultValue={selectedIp} style={{width: 160}}
                                        onChange={handleChange}>
                    {ips.length > 0 ? ips.map((ip) => (<Option value={ip} key={ip}>
                        {ip}
                    </Option>)) : ''}
                </Select>)}

                {path && (<CopyToClipboard text={path}>
                    {/*<Tooltip trigger="click" placement="right" title="Copied!">*/}
                    <Button onClick={() => {
                        message.info("Copied!", 1).then(() => {
                        })
                    }} type="primary" icon={<CopyOutlined/>}/>
                    {/*</Tooltip>*/}
                </CopyToClipboard>)}
            </Space>

            {path && <QRCodeSVG width={250} height={250} value={path}/>}
            {/*{path}*/}
        </Space>
    </>);
}

export default Login;
