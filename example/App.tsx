/**
 * react-native-notifications HarmonyOS 示例
 *
 * 覆盖核心 API：授权注册（含失败路径）、本地通知（基础/渠道/行动按钮+文本输入/更新/取消）、
 * 已发通知查询与删除、角标、冷启动通知、Push Kit 注册与透传、事件监听与卸载。
 * 平台不支持的能力在界面“平台差异说明”区明确提示。
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Button,
} from 'react-native';
import { Notifications } from 'react-native-notifications';

type LogEntry = { time: string; text: string; kind: 'event' | 'result' | 'action' };

const LogPanelColors: Record<string, string> = {
  event: '#8a2be2',
  result: '#0a7d3f',
  action: '#555555',
};

export default function App() {
  const [log, setLog] = useState<LogEntry[]>([]);
  const [registered, setRegistered] = useState<boolean | null>(null);
  const [permissions, setPermissions] = useState<string>('未查询');
  const [badgeCount, setBadgeCountState] = useState<number | null>(null);
  const [delivered, setDelivered] = useState<string[]>([]);
  const [initialNotification, setInitialNotification] = useState<string>('未查询');
  const [postedCount, setPostedCount] = useState(0);
  const notificationIdRef = useRef<number>(new Date().getTime() % 100000);

  const appendLog = (text: string, kind: LogEntry['kind'] = 'event') => {
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now
      .getMinutes()
      .toString()
      .padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
    setLog((prev) => [{ time, text, kind }, ...prev].slice(0, 200));
  };

  useEffect(() => {
    // 事件监听：组件挂载注册、卸载时全部移除（资源释放契约）
    const subscriptions = [
      Notifications.events().registerRemoteNotificationsRegistered((event: any) => {
        appendLog(`remoteNotificationsRegistered deviceToken=${event.deviceToken}`);
      }),
      Notifications.events().registerRemoteNotificationsRegistrationFailed((event: any) => {
        appendLog(
          `remoteNotificationsRegistrationFailed code=${event.code} ${event.localizedDescription ?? event.message}（Push token 依赖 AGC 开通推送服务，本地通知不受影响）`
        );
      }),
      Notifications.events().registerRemoteNotificationsRegistrationDenied(() => {
        appendLog('remoteNotificationsRegistrationDenied（用户拒绝通知授权）');
      }),
      Notifications.events().registerNotificationReceivedForeground(
        (notification: any, completion: any) => {
          appendLog(
            `notificationReceived(前台) title=${notification.title} body=${notification.body}`
          );
          completion({ alert: true, sound: true, badge: false });
        }
      ),
      Notifications.events().registerNotificationReceivedBackground((notification: any) => {
        appendLog(
          `notificationReceivedBackground(后台) title=${notification.title} body=${notification.body}`
        );
      }),
      Notifications.events().registerNotificationOpened(
        (notification: any, completion: any, actionResponse: any) => {
          if (actionResponse) {
            appendLog(
              `notificationOpened action=${actionResponse.identifier} text=${actionResponse.text} notification=${notification.title}`
            );
          } else {
            appendLog(`notificationOpened（点击通知本体） title=${notification.title}`);
          }
          completion();
        }
      ),
      Notifications.ios.events().registerPushKitRegistered((event: any) => {
        appendLog(`pushKitRegistered pushKitToken=${event.pushKitToken}`);
      }),
      Notifications.ios.events().registerPushKitNotificationReceived((event: any) => {
        appendLog(`pushKitNotificationReceived type=${event?.type} data=${JSON.stringify(event?.data)}`);
      }),
    ];

    return () => {
      subscriptions.forEach((subscription) => subscription.remove());
    };
  }, []);

  // ---------- 注册与权限 ----------

  const doRegister = () => {
    appendLog('调用 registerRemoteNotifications()（弹授权框→取 Push token）', 'action');
    Notifications.registerRemoteNotifications();
  };

  const doRefreshToken = () => {
    appendLog('调用 android.refreshToken()', 'action');
    (Notifications.android as any).refreshToken();
  };

  const doRegisterPushKit = () => {
    appendLog('调用 ios.registerPushKit()', 'action');
    (Notifications.ios as any).registerPushKit();
  };

  const doAbandonPermissions = () => {
    appendLog('调用 ios.abandonPermissions()（鸿蒙语义：跳转本应用通知设置页）', 'action');
    (Notifications.ios as any).abandonPermissions();
  };

  const doCheckRegistered = () => {
    Notifications.isRegisteredForRemoteNotifications().then((value: boolean) => {
      setRegistered(value);
      appendLog(`isRegisteredForRemoteNotifications → ${value}`, 'result');
    });
  };

  const doCheckPermissions = () => {
    // checkPermissions 位于 ios 面（wix 原库公开面，鸿蒙同样实现）
    (Notifications.ios as any).checkPermissions().then((value: object) => {
      setPermissions(JSON.stringify(value));
      appendLog(`checkPermissions → ${JSON.stringify(value)}`, 'result');
    });
  };

  // ---------- 本地通知 ----------

  const nextId = (): number => {
    notificationIdRef.current += 1;
    return notificationIdRef.current;
  };

  const postBasic = () => {
    const id = nextId();
    Notifications.postLocalNotification(
      {
        identifier: '0',
        title: '基础本地通知',
        body: `编号 ${id}：来自 HarmonyOS 通知中心的基础文本通知`,
        sound: '',
        badge: 0,
        type: '',
        thread: '',
        payload: { category: '', link: 'rnnotifications://demo/basic' },
      } as any,
      id
    );
    setPostedCount((count) => count + 1);
    appendLog(`postLocalNotification(基础) id=${id}`, 'action');
  };

  const postWithActions = () => {
    const id = nextId();
    Notifications.postLocalNotification(
      {
        identifier: '0',
        title: '带行动按钮的通知',
        body: '展开通知可见“接受(可输入文本)/拒绝”按钮，点击后经 notificationOpened 回传',
        sound: '',
        badge: 0,
        type: '',
        thread: '',
        payload: { category: 'SOME_CATEGORY', link: 'rnnotifications://demo/action' },
      } as any,
      id
    );
    setPostedCount((count) => count + 1);
    appendLog(`postLocalNotification(行动按钮) id=${id}`, 'action');
  };

  const postOnChannel = () => {
    const id = nextId();
    Notifications.postLocalNotification(
      {
        identifier: '0',
        title: '渠道通知',
        body: '经 my-channel（importance=HIGH→社交通信槽，横幅+提示）发布',
        sound: '',
        badge: 0,
        type: '',
        thread: '',
        payload: { category: '', android_channel_id: 'my-channel' },
      } as any,
      id
    );
    setPostedCount((count) => count + 1);
    appendLog(`postLocalNotification(渠道 my-channel) id=${id}`, 'action');
  };

  const postUpdate = () => {
    const id = notificationIdRef.current;
    Notifications.postLocalNotification(
      {
        identifier: '0',
        title: '已更新的通知',
        body: `同 id=${id} 再次发布即原位更新`,
        sound: '',
        badge: 0,
        type: '',
        thread: '',
        payload: { category: '', updated: true },
      } as any,
      id
    );
    appendLog(`postLocalNotification(更新) id=${id}`, 'action');
  };

  const postWithBadgeAndSound = () => {
    const id = nextId();
    Notifications.postLocalNotification(
      {
        identifier: '0',
        title: '带角标与声音字段的通知',
        body: 'badge=3 随通知设置角标；sound=chime.wav 使用 rawfile 内置示例铃声',
        sound: 'chime.wav',
        badge: 3,
        type: '',
        thread: '',
        payload: { category: '' },
      } as any,
      id
    );
    setPostedCount((count) => count + 1);
    appendLog(`postLocalNotification(角标+声音) id=${id}`, 'action');
  };

  const cancelLast = () => {
    const id = notificationIdRef.current;
    Notifications.cancelLocalNotification(id);
    appendLog(`cancelLocalNotification(${id})`, 'action');
  };

  const cancelAll = () => {
    // cancelAllLocalNotifications 位于 ios 面（wix 原库公开面，鸿蒙同样实现），
    // 根对象没有该方法
    (Notifications.ios as any).cancelAllLocalNotifications();
    appendLog('cancelAllLocalNotifications()', 'action');
  };

  // ---------- 已发通知 ----------

  const refreshDelivered = () => {
    Notifications.ios
      .getDeliveredNotifications()
      .then((list: any[]) => {
        const lines = list.map(
          (item) => `id=${item.identifier} ${item.title ?? ''} ${item.body ?? ''}`
        );
        setDelivered(lines);
        appendLog(`getDeliveredNotifications → ${list.length} 条`, 'result');
      });
  };

  const removeFirstDelivered = () => {
    Notifications.ios.getDeliveredNotifications().then((list: any[]) => {
      if (list.length === 0) {
        appendLog('removeDeliveredNotifications：当前无已发通知', 'result');
        return;
      }
      const identifiers: string[] = [String(list[0].identifier)];
      Notifications.ios.removeDeliveredNotifications(identifiers);
      appendLog(`removeDeliveredNotifications(${identifiers.join(',')})`, 'action');
    });
  };

  const removeAllDelivered = () => {
    Notifications.removeAllDeliveredNotifications();
    appendLog('removeAllDeliveredNotifications()', 'action');
  };

  // ---------- 渠道 / 角标 / 冷启动 ----------

  const setUpChannel = () => {
    Notifications.setNotificationChannel({
      channelId: 'my-channel',
      name: '演示渠道(HIGH)',
      importance: 4,
      description: 'importance=4 映射社交通信槽（横幅提醒）',
      enableVibration: true,
      soundFile: '',
    } as any);
    appendLog('setNotificationChannel(my-channel, importance=4)', 'action');
  };

  const setCategories = () => {
    Notifications.setCategories([
      {
        identifier: 'SOME_CATEGORY',
        actions: [
          {
            identifier: 'ACCEPT_ACTION',
            activationMode: 'background',
            title: '接受',
            authenticationRequired: true,
            textInput: { buttonTitle: '发送', placeholder: '输入回复内容' },
          },
          {
            identifier: 'DECLINE_ACTION',
            activationMode: 'background',
            title: '拒绝',
            authenticationRequired: false,
          },
        ],
      },
    ] as any);
    appendLog('setCategories(SOME_CATEGORY: 接受[文本输入]/拒绝)', 'action');
  };

  const doSetBadge = (count: number) => {
    (Notifications.ios as any).setBadgeCount(count);
    appendLog(`setBadgeCount(${count})`, 'action');
    (Notifications.ios as any)
      .getBadgeCount()
      .then((value: number) => {
        setBadgeCountState(value);
        appendLog(`getBadgeCount → ${value}`, 'result');
      });
  };

  const doGetInitial = () => {
    Notifications.getInitialNotification().then((notification: any) => {
      if (notification && notification.identifier !== undefined) {
        const text = `identifier=${notification.identifier} title=${notification.title ?? ''} body=${notification.body ?? ''}`;
        setInitialNotification(text);
        appendLog(`getInitialNotification → ${text}`, 'result');
      } else {
        setInitialNotification('无冷启动通知');
        appendLog('getInitialNotification → 无冷启动通知', 'result');
      }
    });
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>react-native-notifications · HarmonyOS</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>注册与权限</Text>
          <View style={styles.row}>
            <Button title="申请授权并注册" onPress={doRegister} />
          </View>
          <View style={styles.row}>
            <Button title="刷新 Push token" onPress={doRefreshToken} />
            <Button title="registerPushKit" onPress={doRegisterPushKit} />
          </View>
          <View style={styles.row}>
            <Button title="撤销授权(跳设置)" onPress={doAbandonPermissions} />
            <Button title="查询注册状态" onPress={doCheckRegistered} />
          </View>
          <Text style={styles.value}>通知开关：{registered === null ? '未查询' : String(registered)}</Text>
          <View style={styles.row}>
            <Button title="checkPermissions" onPress={doCheckPermissions} />
          </View>
          <Text style={styles.value}>权限：{permissions}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>本地通知（已发布 {postedCount} 条）</Text>
          <View style={styles.row}>
            <Button title="发布基础通知" onPress={postBasic} />
            <Button title="带行动按钮" onPress={postWithActions} />
          </View>
          <View style={styles.row}>
            <Button title="发布渠道通知" onPress={postOnChannel} />
            <Button title="原位更新" onPress={postUpdate} />
          </View>
          <View style={styles.row}>
            <Button title="角标+声音字段" onPress={postWithBadgeAndSound} />
          </View>
          <View style={styles.row}>
            <Button title="注册类别" onPress={setCategories} />
            <Button title="注册渠道" onPress={setUpChannel} />
          </View>
          <View style={styles.row}>
            <Button title="取消最后一条" onPress={cancelLast} />
            <Button title="取消全部" onPress={cancelAll} />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>已发通知</Text>
          <View style={styles.row}>
            <Button title="查询已发" onPress={refreshDelivered} />
            <Button title="删除第一条" onPress={removeFirstDelivered} />
          </View>
          <View style={styles.row}>
            <Button title="删除全部" onPress={removeAllDelivered} />
          </View>
          {delivered.map((line, index) => (
            <Text key={`${line}-${index}`} style={styles.value}>
              · {line}
            </Text>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>角标 / 冷启动</Text>
          <View style={styles.row}>
            <Button title="设角标=3" onPress={() => doSetBadge(3)} />
            <Button title="清角标" onPress={() => doSetBadge(0)} />
          </View>
          <Text style={styles.value}>当前角标：{badgeCount === null ? '未查询' : String(badgeCount)}</Text>
          <View style={styles.row}>
            <Button title="getInitialNotification" onPress={doGetInitial} />
          </View>
          <Text style={styles.value}>冷启动通知：{initialNotification}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>平台差异说明（鸿蒙）</Text>
          <Text style={styles.note}>
            · 前台通知展示的 completion 机制（finishPresentingNotification 等 3 个 finish 方法）鸿蒙无对应能力，为空实现；{'\n'}
            · abandonPermissions 鸿蒙不能程序化撤销授权，语义为跳转系统通知设置页；{'\n'}
            · Push token（remoteNotificationsRegistered/pushKitRegistered）依赖 AGC 开通推送与真机环境，未开通时走 registrationFailed 事件（1000900012 等），本地通知不受影响；{'\n'}
            · appNotificationSettingsLinked 为 iOS 专属事件，鸿蒙不会派发；{'\n'}
            · getBadgeCount 在 API 22 以下设备返回最近一次 setBadgeCount 的记录值。
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>事件日志（最新在前）</Text>
          <ScrollView style={styles.logScroll}>
            {log.map((entry, index) => (
              <Text
                key={`${entry.time}-${index}`}
                style={[styles.logLine, { color: LogPanelColors[entry.kind] ?? '#555555' }]}>
                [{entry.time}] {entry.text}
              </Text>
            ))}
            {log.length === 0 ? <Text style={styles.logLine}>（暂无事件）</Text> : null}
          </ScrollView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f2f2f2',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 12,
    color: '#222222',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333333',
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  value: {
    fontSize: 13,
    color: '#333333',
    marginTop: 4,
  },
  note: {
    fontSize: 12,
    color: '#8a6d3b',
    lineHeight: 18,
  },
  logScroll: {
    maxHeight: 240,
  },
  logLine: {
    fontSize: 12,
    lineHeight: 18,
  },
});
