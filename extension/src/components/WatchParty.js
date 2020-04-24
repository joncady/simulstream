import React, { useEffect, useState, useRef } from 'react';


export default function StartParty() {

    let [isStart, setIsStart] = useState(false);
    let [partyUrl, setPartyUrl] = useState("");
    let [tabUrl, setTabUrl] = useState("");
    let [tabId, setTabId] = useState(null)
    const urlTextArea = useRef(null);

    useEffect(() => {
        window.chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            let activeTab = tabs[0];
            setTabUrl(activeTab.url);
            let url = new URL(activeTab.url);
            if (url.search) {
                let wpSession = url.searchParams.get("wpSession");
                if (wpSession) {
                    setIsStart(true);
                    setPartyUrl(activeTab.url);
                    setTabId(activeTab.id);
                }
            }
        })
    }, [])

    const generateSession = () => {
        let url = new URL(tabUrl);
        let showId;
        let spaceCount;
        if (url.host.includes("amazon")) {
            spaceCount = 3;
        } else if (url.host.includes("netflix")) {
            spaceCount = 1;
        } else {
            spaceCount = 0;
        }
        showId = url.pathname.split("/").filter(section => section !== "")[spaceCount];
        let sessionId = String(showId) + "-" + String(Math.round(new Date().valueOf() / 1000));
        let newUrl;
        if (url.search.length == 0) {
            newUrl = tabUrl + "?wpSession=" + sessionId;
        } else {
            newUrl = tabUrl + "&wpSession=" + sessionId;
        }

        window.chrome.tabs.update(tabId, { url: newUrl });

        setPartyUrl(newUrl);
        setIsStart(true);
    }

    const copyUrl = () => {
        urlTextArea.current.select();
        document.execCommand('copy');
    }

    const stopSession = () => {
        let url = new URL(tabUrl);
        let searchVariables = url.searchParams;
        searchVariables.delete("wpSession");
        let searchList = [];
        for (const [key, value] of searchVariables) {
            searchList.push(key + "=" + value);
        }
        let newUrl = tabUrl.split("?")[0] + (searchList.length > 0) && ("?" + searchList.join("&"));
        window.chrome.tabs.update(tabId, { url: newUrl });
        setIsStart(false);
    }
      
    console.log(isStart);   

    if (!isStart) {
        return (
            <div>
                <button onClick={generateSession}>Start a party!</button>
            </div>
        );
    } else {
        return (
            <div>
                <h3>There is a party started!</h3>
                <div>
                    <textarea ref={urlTextArea} value={partyUrl}></textarea>
                    <button onClick={copyUrl}>Copy!</button>
                </div>
                <div>
                    <button onClick={stopSession}>Stop session</button>
                </div>
            </div>
        )
    }
}




