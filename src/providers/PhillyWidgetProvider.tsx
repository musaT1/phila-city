/*---------------------------------------------------------------------------------------------
 * Copyright (c) Bentley Systems, Incorporated. All rights reserved.
 * See LICENSE.md in the project root for license terms and full copyright notice.
 *--------------------------------------------------------------------------------------------*/

import { Widget, StagePanelSection, StagePanelLocation, UiItemsProvider } from "@itwin/appui-react";
import { MyFirstWidget } from "./MyFirstWidget";
import React from "react";

export class PhillyWidgetProvider implements UiItemsProvider {
  public readonly id = "PhillyWidget";

  public provideWidgets(
    stageId: string,
    _stageUsage: string,
    location: StagePanelLocation,
    _section?: StagePanelSection | undefined
  ): ReadonlyArray<Widget> {
    const widgets: Widget[] = [];

    widgets.push({
      id: "phillyWidget",
      label: "Change Me!!",
      content:
        <div>
          <MyFirstWidget />
        </div>
    });
    return widgets;
  }
}