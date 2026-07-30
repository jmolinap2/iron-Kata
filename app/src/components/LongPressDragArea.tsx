import { useEffect, useRef, type PropsWithChildren } from 'react';
import {
  PanResponder,
  View,
  type GestureResponderEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

type LongPressDragAreaProps = PropsWithChildren<{
  accessibilityLabel: string;
  dragDisabled?: boolean;
  holdDelay?: number;
  style?: StyleProp<ViewStyle>;
  onTap?: () => void;
  onDragStart: () => void;
  onDragMove: (offsetY: number) => void;
  onDragEnd: (startPointerY: number, pointerY: number) => void;
  onDragCancel: () => void;
}>;

export function LongPressDragArea({
  accessibilityLabel,
  children,
  dragDisabled = false,
  holdDelay = 280,
  style,
  onTap,
  onDragStart,
  onDragMove,
  onDragEnd,
  onDragCancel,
}: LongPressDragAreaProps) {
  const callbacks = useRef({ onTap, onDragStart, onDragMove, onDragEnd, onDragCancel });
  callbacks.current = { onTap, onDragStart, onDragMove, onDragEnd, onDragCancel };
  const dragDisabledRef = useRef(dragDisabled);
  dragDisabledRef.current = dragDisabled;
  const active = useRef(false);
  const responderGranted = useRef(false);
  const moved = useRef(false);
  const suppressTap = useRef(false);
  const startPointerY = useRef(0);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHoldTimer = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = null;
  };

  const reset = (notifyCancel: boolean) => {
    const wasLongPress = active.current || suppressTap.current;
    clearHoldTimer();
    if (notifyCancel && active.current) callbacks.current.onDragCancel();
    active.current = false;
    responderGranted.current = false;
    moved.current = false;
    suppressTap.current = wasLongPress;
  };

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: () => active.current,
    onMoveShouldSetPanResponderCapture: () => active.current,
    onPanResponderGrant: () => {
      responderGranted.current = true;
    },
    onPanResponderMove: (_, gesture) => {
      if (active.current) callbacks.current.onDragMove(gesture.moveY - startPointerY.current);
    },
    onPanResponderRelease: (_, gesture) => {
      clearHoldTimer();
      if (active.current) callbacks.current.onDragEnd(startPointerY.current, gesture.moveY);
      active.current = false;
      responderGranted.current = false;
      moved.current = false;
    },
    onPanResponderTerminate: () => reset(true),
    onPanResponderTerminationRequest: () => false,
  })).current;

  useEffect(() => () => clearHoldTimer(), []);

  const handleTouchStart = (event: GestureResponderEvent) => {
    clearHoldTimer();
    startPointerY.current = event.nativeEvent.pageY;
    active.current = false;
    responderGranted.current = false;
    moved.current = false;
    suppressTap.current = false;
    if (dragDisabledRef.current) return;
    holdTimer.current = setTimeout(() => {
      active.current = true;
      suppressTap.current = true;
      callbacks.current.onDragStart();
    }, holdDelay);
  };

  const handleTouchMove = (event: GestureResponderEvent) => {
    const offset = event.nativeEvent.pageY - startPointerY.current;
    if (Math.abs(offset) > 7) {
      moved.current = true;
      if (!active.current) clearHoldTimer();
    }
    if (active.current && !responderGranted.current) callbacks.current.onDragMove(offset);
  };

  const handleTouchEnd = () => {
    clearHoldTimer();
    if (responderGranted.current) return;
    if (active.current) {
      callbacks.current.onDragCancel();
    } else if (!moved.current && !suppressTap.current) {
      callbacks.current.onTap?.();
    }
    active.current = false;
    moved.current = false;
    suppressTap.current = false;
  };

  const handleTouchCancel = () => {
    if (!responderGranted.current) reset(true);
  };

  return (
    <View
      {...panResponder.panHandlers}
      accessible
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      style={style}
    >
      {children}
    </View>
  );
}
