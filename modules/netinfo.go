package modules

import (
	"fmt"
	"net"
)

type NetInfo struct {
}

func NewNetInfo() *NetInfo {
	return &NetInfo{}
}

func (n *NetInfo) GetIps() ([]string, error) {
	addrs, err := net.InterfaceAddrs()
	if err != nil {
		fmt.Println("GetIps: ", err)

		return nil, fmt.Errorf("GetIps: %s", err)
	}

	ips := make([]string, 0)
	for _, addr := range addrs {
		if ipnet, ok := addr.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
			if ipnet.IP.To4() != nil {
				ips = append(ips, ipnet.IP.String())
			}
		}
	}

	return ips, nil
}
