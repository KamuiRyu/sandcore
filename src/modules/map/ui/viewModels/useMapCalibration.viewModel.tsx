import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type WheelEvent,
} from "react";
import {
  mapAspectRatio,
  maxMapZoom,
  minMapZoom,
  zoomButtonFactor,
  defaultMapRegion,
  defaultMarkerType,
  getDefaultMarkerIcon,
  type MapRegionId,
} from "../../core/entities/MapConfig.entity";
import { mapPoints } from "../../core/entities/MapPoints.entity";
import type {
  CalibrationPoint,
  DragState,
  EditablePointField,
  MapCamera,
  MapCoords,
  MapLayerId,
  MapMarkerType,
} from "../../core/entities/MapCalibration.entity";
import {
  clamp,
  clampMapCamera,
} from "../../core/usecases/ClampMapCamera.usecase";
import { createCalibrationPoint } from "../../core/usecases/CreateCalibrationPoint.usecase";
import { resolveMapPointerCoords } from "../../core/usecases/ResolveMapPointerCoords.usecase";
import {
  createMapPointSnippet,
  createCategorizedMapPointsJson,
} from "../../core/usecases/SerializeMapCalibration.usecase";
import type { PointerViewportRect } from "../../core/usecases/ResolveMapPointerCoords.usecase";
import {
  toggleCalibrationPointLayer,
  updateCalibrationPointField,
  slugifyMapPointName,
} from "../../core/usecases/UpdateCalibrationPoint.usecase";
import { detectSubRegion } from "../../core/entities/SubRegionBoundaries.entity";

async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const textarea = document.createElement("textarea");

  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

function clonePoint(point: CalibrationPoint): CalibrationPoint {
  return {
    ...point,
    layerIds: [...point.layerIds],
  };
}

function getNextPointId(points: CalibrationPoint[]) {
  const nextId =
    points.reduce((maxId, point) => {
      const id = parseInt(point.id, 10);
      return isNaN(id) ? maxId : Math.max(maxId, id);
    }, 0) + 1;
  console.log(
    `getNextPointId: current_points_count=${points.length}, nextId=${nextId}`,
  );
  return nextId;
}

type ZoomAnchor = {
  clientX: number;
  clientY: number;
};

export function useMapCalibrationViewModel() {
  const nextPointIdRef = useRef(getNextPointId(mapPoints));
  const mapViewportRef = useRef<HTMLDivElement | null>(null);
  const mapSurfaceRef = useRef<HTMLDivElement | null>(null);
  const lastPointerClientRef = useRef<ZoomAnchor | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const [cursorPoint, setCursorPoint] = useState<MapCoords | null>(null);
  const [currentPoint, setCurrentPoint] = useState<CalibrationPoint | null>(
    null,
  );
  const [savedPoints, setSavedPoints] = useState<CalibrationPoint[]>([]);
  const [history, setHistory] = useState<CalibrationPoint[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  function pushToHistory(newPoints: CalibrationPoint[]) {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newPoints);
    if (newHistory.length > 50) newHistory.shift(); // Limit history size
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }

  function undo() {
    if (historyIndex > 0) {
      const nextIndex = historyIndex - 1;
      setHistoryIndex(nextIndex);
      setSavedPoints(history[nextIndex]);
      setCopyFeedback("Desfeito.");
    }
  }

  function redo() {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setSavedPoints(history[nextIndex]);
      setCopyFeedback("Refeito.");
    }
  }

  const [creationDefaults, setCreationDefaults] = useState<{
    type: MapMarkerType;
    iconId: string;
    regionId: string;
    subRegionId: string;
    useDefaults: boolean;
  }>({
    type: defaultMarkerType,
    iconId: getDefaultMarkerIcon(defaultMarkerType),
    regionId: defaultMapRegion,
    subRegionId: "",
    useDefaults: true,
  });

  function updateCreationDefaults(field: string, value: unknown) {
    setCreationDefaults((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "type") {
        next.iconId = getDefaultMarkerIcon(value as MapMarkerType);
      }
      return next;
    });
  }

  function loadSystemPoints() {
    const points = mapPoints.map(clonePoint);
    setSavedPoints(points);
    pushToHistory(points);
    setCopyFeedback("Pontos do sistema carregados.");
  }
  const [fencePoints, setFencePoints] = useState<MapCoords[]>([]);
  const [camera, setCamera] = useState<MapCamera>({ scale: 1, x: 0, y: 0 });
  const [dragCamera, setDragCamera] = useState<MapCamera | null>(null);
  const [zoomDraftScale, setZoomDraftScale] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [copyFeedback, setCopyFeedback] = useState("Pronto para copiar");
  const [mapSurfaceSize, setMapSurfaceSize] = useState({ height: 0, width: 0 });
  const snippet = currentPoint ? createMapPointSnippet(currentPoint) : "";
  const savedPointsJson = createCategorizedMapPointsJson(savedPoints);
  const fenceJson = JSON.stringify(fencePoints, null, 2);
  const isEditingSavedPoint = currentPoint
    ? savedPoints.some((point) => point.id === currentPoint.id)
    : false;
  const displayedCamera = dragCamera ?? camera;
  const displayedZoomScale = zoomDraftScale ?? camera.scale;
  const zoomTrackProgress = clamp(
    (displayedZoomScale - minMapZoom) / (maxMapZoom - minMapZoom),
    0,
    1,
  );
  const zoomThumbBottom = 4 + zoomTrackProgress * 88;

  function getSurfaceSize() {
    const mapSurface = mapSurfaceRef.current;

    if (!mapSurface) {
      return null;
    }

    return {
      height: mapSurface.offsetHeight,
      width: mapSurface.offsetWidth,
    };
  }

  function clampCamera(nextCamera: MapCamera): MapCamera {
    return clampMapCamera(nextCamera, getSurfaceSize());
  }

  function getStableSurfaceRect(): PointerViewportRect | null {
    const viewport = mapViewportRef.current;

    if (!viewport || !mapSurfaceSize.width || !mapSurfaceSize.height) {
      return null;
    }

    const viewportRect = viewport.getBoundingClientRect();

    return {
      height: mapSurfaceSize.height,
      left: viewportRect.left + (viewportRect.width - mapSurfaceSize.width) / 2,
      top: viewportRect.top + (viewportRect.height - mapSurfaceSize.height) / 2,
      width: mapSurfaceSize.width,
    };
  }

  function getCoordinateFromPointer(
    event: Pick<PointerEvent<HTMLDivElement>, "clientX" | "clientY">,
    currentCamera: MapCamera,
  ): MapCoords | null {
    const stableSurfaceRect = getStableSurfaceRect();

    if (!stableSurfaceRect) {
      return null;
    }

    return resolveMapPointerCoords(
      { x: event.clientX, y: event.clientY },
      stableSurfaceRect,
      currentCamera,
    );
  }

  useEffect(() => {
    const viewportElement = mapViewportRef.current;

    if (!viewportElement) {
      return;
    }

    const stableViewportElement = viewportElement;

    function updateMapSurfaceSize() {
      const viewportWidth = stableViewportElement.clientWidth;
      const viewportHeight = stableViewportElement.clientHeight;

      if (!viewportWidth || !viewportHeight) {
        return;
      }

      const viewportAspectRatio = viewportWidth / viewportHeight;

      if (viewportAspectRatio > mapAspectRatio) {
        const height = viewportHeight;
        const width = height * mapAspectRatio;

        setMapSurfaceSize({ height, width });
        return;
      }

      const width = viewportWidth;
      const height = width / mapAspectRatio;

      setMapSurfaceSize({ height, width });
    }

    updateMapSurfaceSize();

    const resizeObserver = new ResizeObserver(() => {
      updateMapSurfaceSize();
    });

    resizeObserver.observe(stableViewportElement);

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    function handleResize() {
      setDragCamera(null);
      setCamera((currentCamera) =>
        clampMapCamera(currentCamera, getSurfaceSize()),
      );
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const animationFrameId = window.requestAnimationFrame(() => {
      setDragCamera(null);
      setCamera((currentCamera) =>
        clampMapCamera(currentCamera, getSurfaceSize()),
      );
    });

    return () => window.cancelAnimationFrame(animationFrameId);
  }, [isSidebarOpen]);

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    lastPointerClientRef.current = {
      clientX: event.clientX,
      clientY: event.clientY,
    };

    const dragState = dragStateRef.current;

    if (dragState) {
      const dx = event.clientX - dragState.startClientX;
      const dy = event.clientY - dragState.startClientY;
      const didMove = Math.hypot(dx, dy) > 4;

      if (didMove) {
        dragState.hasMoved = true;
        setIsDragging(true);
        setDragCamera(
          clampCamera({
            scale: camera.scale,
            x: dragState.startX + dx,
            y: dragState.startY + dy,
          }),
        );
        return;
      }
    }

    setCursorPoint(getCoordinateFromPointer(event, camera));
  }

  function handlePointerLeave() {
    if (!dragStateRef.current) {
      setCursorPoint(null);
    }

    lastPointerClientRef.current = null;
  }

  function markPoint(event: PointerEvent<HTMLDivElement>) {
    const coords = getCoordinateFromPointer(event, camera);

    if (!coords) {
      return;
    }

    if (event.shiftKey) {
      setFencePoints((prev) => [...prev, coords]);
      setCopyFeedback("Ponto adicionado ao cerco (fence).");
      return;
    }

    if (currentPoint) {
      setCurrentPoint({
        ...currentPoint,
        ...coords,
      });
      setCopyFeedback("Ponto reposicionado no mapa.");
      return;
    }

    // Ensure ID uniqueness based on current savedPoints
    nextPointIdRef.current = getNextPointId(savedPoints);
    const nextId = nextPointIdRef.current++;
    const nextPoint = createCalibrationPoint(String(nextId), coords);

    const detected = detectSubRegion(coords);
    if (detected) {
      nextPoint.regionId = detected.regionId as MapRegionId;
      nextPoint.subRegionId = detected.subRegionId;
    } else if (creationDefaults.useDefaults) {
      nextPoint.type = creationDefaults.type;
      nextPoint.iconId = creationDefaults.iconId;
      nextPoint.regionId = creationDefaults.regionId;
      nextPoint.subRegionId = creationDefaults.subRegionId || undefined;
    }

    setCurrentPoint(nextPoint);
    setCopyFeedback("Ponto marcado. Preencha as informacoes antes de copiar.");
  }

  function addPointAtCoords(coords: MapCoords) {
    // Ensure ID uniqueness based on current savedPoints
    nextPointIdRef.current = getNextPointId(savedPoints);
    const nextId = nextPointIdRef.current++;
    const nextPoint = createCalibrationPoint(String(nextId), coords);

    const detected = detectSubRegion(coords);
    if (detected) {
      nextPoint.regionId = detected.regionId as MapRegionId;
      nextPoint.subRegionId = detected.subRegionId;
    } else if (creationDefaults.useDefaults) {
      nextPoint.type = creationDefaults.type;
      nextPoint.iconId = creationDefaults.iconId;
      nextPoint.regionId = creationDefaults.regionId;
      nextPoint.subRegionId = creationDefaults.subRegionId || undefined;
    }

    setCurrentPoint(nextPoint);
    setCopyFeedback("Ponto marcado. Preencha as informacoes antes de copiar.");
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) {
      return;
    }

    lastPointerClientRef.current = {
      clientX: event.clientX,
      clientY: event.clientY,
    };

    mapSurfaceRef.current?.setPointerCapture(event.pointerId);
    dragStateRef.current = {
      hasMoved: false,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: camera.x,
      startY: camera.y,
    };
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
    const dragState = dragStateRef.current;

    if (dragState?.pointerId === event.pointerId) {
      mapSurfaceRef.current?.releasePointerCapture(event.pointerId);

      if (!dragState.hasMoved) {
        markPoint(event);
      } else {
        const dx = event.clientX - dragState.startClientX;
        const dy = event.clientY - dragState.startClientY;

        setCamera(
          clampCamera({
            scale: camera.scale,
            x: dragState.startX + dx,
            y: dragState.startY + dy,
          }),
        );
      }

      dragStateRef.current = null;
      setDragCamera(null);
      setIsDragging(false);
    }
  }

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    lastPointerClientRef.current = {
      clientX: event.clientX,
      clientY: event.clientY,
    };
    // Geometric zoom makes speed consistent across all zoom levels
    const zoomSensitivity = 0.002;
    const nextScale = camera.scale * Math.exp(-event.deltaY * zoomSensitivity);
    updateZoom(nextScale, {
      clientX: event.clientX,
      clientY: event.clientY,
    });
  }

  function getZoomAnchor(anchor?: ZoomAnchor) {
    if (anchor) {
      return anchor;
    }

    if (lastPointerClientRef.current) {
      return lastPointerClientRef.current;
    }

    const surface = mapSurfaceRef.current;

    if (!surface) {
      return null;
    }

    const rect = surface.getBoundingClientRect();

    return {
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2,
    };
  }

  function updateZoom(nextScale: number, anchor?: ZoomAnchor) {
    const surface = mapSurfaceRef.current;
    const resolvedAnchor = getZoomAnchor(anchor);
    const stableSurfaceRect = getStableSurfaceRect();

    setDragCamera(null);
    setZoomDraftScale(null);

    if (!surface || !resolvedAnchor || !stableSurfaceRect) {
      setCamera((currentCamera) =>
        clampCamera({
          ...currentCamera,
          scale: nextScale,
        }),
      );
      return;
    }

    setCamera((currentCamera) => {
      const centerX = stableSurfaceRect.width / 2;
      const centerY = stableSurfaceRect.height / 2;
      const pointerX = resolvedAnchor.clientX - stableSurfaceRect.left;
      const pointerY = resolvedAnchor.clientY - stableSurfaceRect.top;
      const targetScale = clamp(nextScale, minMapZoom, maxMapZoom);
      const mapX =
        (pointerX - centerX - currentCamera.x) / currentCamera.scale + centerX;
      const mapY =
        (pointerY - centerY - currentCamera.y) / currentCamera.scale + centerY;

      return clampCamera({
        scale: targetScale,
        x: pointerX - centerX - (mapX - centerX) * targetScale,
        y: pointerY - centerY - (mapY - centerY) * targetScale,
      });
    });
  }

  function zoomIn() {
    updateZoom(displayedZoomScale * zoomButtonFactor);
  }

  function zoomOut() {
    updateZoom(displayedZoomScale / zoomButtonFactor);
  }

  function getZoomScaleFromPointer(event: PointerEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const progress = clamp((rect.bottom - event.clientY) / rect.height, 0, 1);

    return minMapZoom + progress * (maxMapZoom - minMapZoom);
  }

  function handleZoomPointerDown(event: PointerEvent<HTMLButtonElement>) {
    event.currentTarget.setPointerCapture(event.pointerId);
    setZoomDraftScale(getZoomScaleFromPointer(event));
  }

  function handleZoomPointerMove(event: PointerEvent<HTMLButtonElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
      return;
    }

    setZoomDraftScale(getZoomScaleFromPointer(event));
  }

  function handleZoomPointerUp(event: PointerEvent<HTMLButtonElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) {
      return;
    }

    const nextScale = getZoomScaleFromPointer(event);

    event.currentTarget.releasePointerCapture(event.pointerId);
    setZoomDraftScale(null);
    updateZoom(nextScale);
  }

  function handleZoomPointerCancel(event: PointerEvent<HTMLButtonElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    setZoomDraftScale(null);
  }

  function updateSelectedPoint(field: EditablePointField, value: string) {
    setCurrentPoint((point) =>
      point ? updateCalibrationPointField(point, field, value) : point,
    );
  }

  function toggleSelectedLayer(layerId: MapLayerId) {
    setCurrentPoint((point) =>
      point ? toggleCalibrationPointLayer(point, layerId) : point,
    );
  }

  function clearCurrentPoint() {
    setCurrentPoint(null);
    setCopyFeedback("Ponto limpo. Clique no mapa para marcar outro local.");
  }

  function selectSavedPoint(pointId: string) {
    console.log("Selecting point:", pointId);
    const point = savedPoints.find(
      (currentSavedPoint) => currentSavedPoint.id === pointId,
    );

    if (!point) {
      return;
    }

    setCurrentPoint(clonePoint(point));
    setCopyFeedback(
      "Ponto carregado para edicao. Clique no mapa para reposicionar, se quiser.",
    );
  }

  function saveCurrentPoint() {
    if (!currentPoint) {
      return;
    }

    const pointToSave = clonePoint(currentPoint);
    console.log("saveCurrentPoint: saving point", pointToSave);

    const pointIndex = savedPoints.findIndex(
      (point) => point.id === pointToSave.id,
    );

    let newPoints;
    if (pointIndex === -1) {
      newPoints = [...savedPoints, pointToSave];
    } else {
      newPoints = savedPoints.map((point) =>
        point.id === pointToSave.id ? pointToSave : point,
      );
    }
    console.log("saveCurrentPoint: new savedPoints list", newPoints);
    setSavedPoints(newPoints);
    pushToHistory(newPoints);

    setCurrentPoint(null);
    setCopyFeedback(
      isEditingSavedPoint
        ? "Ponto atualizado no mapa."
        : "Ponto salvo no mapa. Clique para marcar o proximo.",
    );
  }

  function removeLastSavedPoint() {
    if (fencePoints.length > 0) {
      setFencePoints((prev) => prev.slice(0, -1));
      setCopyFeedback("Ultimo ponto do cerco removido.");
      return;
    }
    const newPoints = savedPoints.slice(0, -1);
    setSavedPoints(newPoints);
    pushToHistory(newPoints);
    setCopyFeedback("Ultimo point salvo removido.");
  }

  function clearFence() {
    setFencePoints([]);
    setCopyFeedback("Cerco limpo.");
  }

  function removeSavedPoint(pointId: string) {
    const newPoints = savedPoints.filter((point) => point.id !== pointId);
    setSavedPoints(newPoints);
    pushToHistory(newPoints);
    setCurrentPoint((point) => (point?.id === pointId ? null : point));
    setCopyFeedback("Point removido do mapa.");
  }

  async function handleCopy(value: string, feedback: string) {
    if (!value) {
      return;
    }

    try {
      await copyText(value);
      setCopyFeedback(feedback);
    } catch {
      setCopyFeedback("Nao foi possivel copiar automaticamente");
    }
  }

  function importPoints(pointsData: unknown) {
    let pointsToImport: CalibrationPoint[] = [];

    if (Array.isArray(pointsData)) {
      pointsToImport = pointsData as CalibrationPoint[];
    } else if (typeof pointsData === "object" && pointsData !== null) {
      pointsToImport = Object.values(
        pointsData as Record<string, CalibrationPoint[]>,
      ).flat();
    }

    console.log("importPoints: points to import", pointsToImport);

    const prevPoints = savedPoints;
    let currentMaxId = getNextPointId(prevPoints) - 1;

    const newPointsList = pointsToImport.map((p) => {
      currentMaxId++;
      // Ensure markerId exists for stability
      const markerId = p.markerId || slugifyMapPointName(p.name);

      return {
        ...p,
        // Use existing ID if present, otherwise generate a new unique one based on increment
        id: p.id || `${p.type}-${markerId}-${currentMaxId}`,
        markerId: markerId,
      };
    });

    const updatedPoints = [...prevPoints, ...newPointsList];
    console.log("importPoints: updated points", updatedPoints);
    nextPointIdRef.current = getNextPointId(updatedPoints);
    setSavedPoints(updatedPoints);
    pushToHistory(updatedPoints);
    setCopyFeedback("Pontos importados com sucesso.");
  }

  return {
    camera,
    clearCurrentPoint,
    clearFence,
    copyFeedback,
    creationDefaults,
    updateCreationDefaults,
    currentPoint,
    cursorPoint,
    displayedCamera,
    displayedZoomScale,
    fencePoints,
    fenceJson,
    handleCopy,
    handlePointerDown,
    handlePointerLeave,
    handlePointerMove,
    handlePointerUp,
    handleWheel,
    handleZoomPointerCancel,
    handleZoomPointerDown,
    handleZoomPointerMove,
    handleZoomPointerUp,
    isDragging,
    isSidebarOpen,
    mapSurfaceRef,
    mapSurfaceSize,
    mapViewportRef,
    removeLastSavedPoint,
    removeSavedPoint,
    saveCurrentPoint,
    savedPoints,
    savedPointsJson,
    selectSavedPoint,
    setIsSidebarOpen,
    setCopyFeedback,
    snippet,
    toggleSelectedLayer,
    updateSelectedPoint,
    zoomIn,
    zoomOut,
    zoomThumbBottom,
    isEditingSavedPoint,
    importPoints,
    loadSystemPoints,
    addPointAtCoords,
    undo,
    redo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
  };
}
