import * as React from "react";
import {useCallback, useState} from "react";
import {Button, Frame, GroupBox, Hourglass, Separator, Window, WindowContent, WindowHeader} from "react95";
import {c} from "../config/config";
import type {Params} from "react-router-dom";
import {useLoaderData} from "react-router-dom";
import {
    extractJiraIssueIdFromURL,
    type ReleaseObject,
    ReleaseObjectSchema,
    sqliteDate,
    type ValidationError,
    ValidationErrorResponseSchema
} from "releasator-types";
import {useImmer} from "use-immer";
import {InputGroup, InputGroupInput, InputGroupName} from "../components/InputGroup";
import {TextInputWrapper} from "../components/TextInputWrapper";
import {FlexRow} from "../components/FlexRow";
import {FlexCol} from "../components/FlexCol";
import {DateEditor} from "../components/releaseEditor/DateEditor";
import {Countdown} from "../components/releaseEditor/Countdown";
import {UTCDate} from "@date-fns/utc";
import {addDays, addHours, addMinutes} from "date-fns";
import {StringsArrayEditor} from "../components/releaseEditor/StringsArrayEditor";
import {Container, ItemCenter} from "../components/Container";
import {Modal} from "../components/Modal";
import {ErrorsDisplay} from "../components/releaseEditor/ErrorsDisplay";
import {ScheduleBarGrid, ScheduleBarRow1, ScheduleBarRow2, ScheduleBarRow3} from "../components/ScheduleBarGrid";

export async function releaseEditLoader({params}: { params: Params<"id" | "hash"> }): Promise<ReleaseObject | null> {
    try {
        const url = `${c.API_ROOT}/api/releases/${params.id}/${params.hash}`;

        console.log(url);

        const response = await fetch(url, {
            method: "GET", // Specify the method
            headers: {
                "Content-Type": "application/json",
                "User-Agent": "releasator-gui/1.0"
            }
        });

        if (response.status === 200) {
            const json = await response.json();
            return ReleaseObjectSchema.parse(json);

        } else if (response.status > 200) {
            // TODO
            console.error("releaseEditLoader got", response.status);
            return null;
        }
    } catch (e) {
        console.error("releaseEditLoader failed");
    }

    return null;
}

function Actions(props: {
    save: () => Promise<void>
}) {
    return <GroupBox style={{padding: 20}} label={"Actions"}>
        <Button
            size={"lg"}
            primary={true}
            variant={"raised"}
            style={{width: 120}}
            onClick={async () => {
                await props.save();
            }}
        >
            <span style={{marginRight: 10}}>💾</span> Save
        </Button>
    </GroupBox>;
}

const ReleaseEditor: React.FC<{ releaseObject: ReleaseObject }> = ({releaseObject}) => {
    const [ro, setRo] = useImmer(releaseObject);
    const [storedQueuedTo, setStoredQueuedTo] = useState(ro.queuedTo);
    const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
    const [fetching, setFetching] = useState(false);
    const save = useCallback(async () => {
        setFetching(true);

        try {
            const url = `${c.API_ROOT}/api/releases/${ro.id}/${ro.editHash}`;

            const response = await fetch(url, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "User-Agent": "releasator-gui/1.0"
                },
                body: JSON.stringify(ro)
            });

            if (response.status === 200) {
                const json = await response.json();
                const ro = ReleaseObjectSchema.parse(json);
                setRo(ro);
                setStoredQueuedTo(ro.queuedTo);
                setFetching(false);
                setValidationErrors([]);

            } else if (response.status > 200) {
                const json = await response.json();
                const parsed = ValidationErrorResponseSchema.safeParse(json);

                if (parsed.success) {
                    setValidationErrors(parsed.data.errors);
                } else {
                    console.error("releaseEditLoader got", response.status);
                    console.error("Unable to parse validation errors", parsed.error);
                    console.error(json);
                }

                setFetching(false);
            }
        } catch (e) {
            // TODO handle error
            console.error("save failed");
            setFetching(false);
        }

        setFetching(false);

    }, [ro, setRo, setStoredQueuedTo]);

    return <>
        {fetching ? <Modal>
            <Window>
                <WindowHeader>
                    <span>save.exe</span>
                </WindowHeader>
                <WindowContent style={{
                    width: 320
                }}>
                    <FlexCol $gap={10} style={{alignItems: "center"}}>
                        <p style={{marginRight: -5}}>Saving...</p>
                        <Hourglass/>
                    </FlexCol>
                </WindowContent>
            </Window>
        </Modal> : null}
        <Container>
            <ItemCenter>
                <Window>
                    <WindowHeader active={!fetching}>
                        <span>Release {ro.head.name} of {ro.repo}</span>
                    </WindowHeader>

                    <WindowContent>
                        <FlexCol $gap={10}>
                            <GroupBox label="⏰ Shedule">
                                <FlexCol $gap={20}>
                                    <InputGroup>
                                        <InputGroupName>
                                            Queued to
                                            <span style={{color: "dimgrey"}}>({ro.queuedTo})</span>
                                            UTC
                                        </InputGroupName>
                                        <InputGroupInput>
                                            <DateEditor
                                                isoString={ro.queuedTo}
                                                onChange={value => {
                                                    setRo((rod) => {
                                                        rod.queuedTo = value;
                                                    });
                                                }}
                                            />
                                        </InputGroupInput>
                                        <ErrorsDisplay errors={validationErrors} paths={["body/queuedTo"]}/>
                                    </InputGroup>
                                    <ScheduleBarGrid>
                                        <ScheduleBarRow1>
                                            <p>Post from now</p>
                                        </ScheduleBarRow1>
                                        <ScheduleBarRow2>
                                            <Button size={"lg"} onClick={() => {
                                                setRo((rod) => {
                                                    rod.queuedTo = sqliteDate(addMinutes(new UTCDate(), 1));
                                                });
                                            }}>
                                                🔥 1m
                                            </Button>

                                            <Button size={"lg"} onClick={() => {
                                                setRo((rod) => {
                                                    rod.queuedTo = sqliteDate(addMinutes(new UTCDate(), 15));
                                                });
                                            }}>
                                                🕒 15m
                                            </Button>

                                            <Button size={"lg"} onClick={() => {
                                                setRo((rod) => {
                                                    rod.queuedTo = sqliteDate(addMinutes(new UTCDate(), 30));
                                                });
                                            }}>
                                                🕔 30m
                                            </Button>
                                        </ScheduleBarRow2>
                                        <ScheduleBarRow3>
                                            <Button size={"lg"} onClick={() => {
                                                setRo((rod) => {
                                                    rod.queuedTo = sqliteDate(addHours(new UTCDate(), 1));
                                                });
                                            }}>
                                                👀 1hr
                                            </Button>

                                            <Button size={"lg"} onClick={() => {
                                                setRo((rod) => {
                                                    rod.queuedTo = sqliteDate(addDays(new UTCDate(), 1));
                                                });
                                            }}>
                                                🫠 Tomorrow
                                            </Button>
                                        </ScheduleBarRow3>
                                    </ScheduleBarGrid>

                                    {(new UTCDate(`${storedQueuedTo}Z`)) > (new UTCDate()) ?
                                        <Frame style={{padding: 20, lineHeight: "1.5"}}>
                                            <Countdown countdownPrefix={"Currently will be posted in"}
                                                       timesUp={"Should be posted already"}
                                                       date={new UTCDate(`${storedQueuedTo}Z`)}/>
                                        </Frame> : null}
                                    {(new UTCDate(`${ro.queuedTo}Z`)) > (new UTCDate()) && ro.queuedTo !== storedQueuedTo ?
                                        <Frame style={{padding: 20, lineHeight: "1.5"}}>
                                            <Countdown countdownPrefix={"After saving will be posted in"}
                                                       timesUp={"Should be posted already, set a different time"}
                                                       date={new UTCDate(`${ro.queuedTo}Z`)}/>
                                        </Frame> : null}

                                    <Separator/>

                                    <InputGroup>
                                        <InputGroupName>
                                            Created at
                                            <span style={{color: "dimgrey"}}>({ro.createdAt})</span>
                                            UTC
                                        </InputGroupName>
                                        <InputGroupInput>
                                            <DateEditor
                                                isoString={ro.createdAt}
                                                onChange={value => {
                                                    setRo((rod) => {
                                                        rod.createdAt = value;
                                                    });
                                                }}
                                            />
                                        </InputGroupInput>
                                        <ErrorsDisplay errors={validationErrors} paths={["body/createdAt"]}/>
                                    </InputGroup>

                                    <InputGroup>
                                        <InputGroupName>
                                            Posted at
                                            <span style={{color: "dimgrey"}}>
                                                ({ro.postedAt ? ro.postedAt : "not yet"})
                                            </span>
                                            UTC
                                        </InputGroupName>
                                        {ro.postedAt ? <InputGroupInput>
                                            <DateEditor
                                                isoString={ro.postedAt}
                                                onChange={value => {
                                                    setRo((rod) => {
                                                        rod.postedAt = value;
                                                    });
                                                }}
                                            />
                                            <ErrorsDisplay errors={validationErrors} paths={["body/postedAt"]}/>
                                        </InputGroupInput> : null}
                                    </InputGroup>
                                </FlexCol>
                            </GroupBox>

                            <Actions save={save}/>

                            <GroupBox label="Refs">
                                <InputGroup>
                                    <InputGroupName>Head</InputGroupName>
                                    <InputGroupInput>
                                        <TextInputWrapper
                                            derivedValue={ro.head.name}
                                            handleChange={value => {
                                                setRo((rod) => {
                                                    rod.head.name = value;
                                                });
                                            }}
                                            fullWidth
                                        />
                                    </InputGroupInput>
                                    <ErrorsDisplay errors={validationErrors} paths={["body/head"]}/>

                                    <InputGroupName>Base</InputGroupName>
                                    <InputGroupInput>
                                        <TextInputWrapper
                                            derivedValue={ro.base.name}
                                            handleChange={value => {
                                                setRo((rod) => {
                                                    rod.base.name = value;
                                                });
                                            }}
                                            fullWidth
                                        />
                                    </InputGroupInput>
                                    <ErrorsDisplay errors={validationErrors} paths={["body/base"]}/>

                                    <InputGroupName>Repo</InputGroupName>
                                    <InputGroupInput>
                                        <TextInputWrapper
                                            derivedValue={ro.repo}
                                            handleChange={value => {
                                                setRo((rod) => {
                                                    rod.repo = value;
                                                });
                                            }}
                                            fullWidth
                                        />
                                    </InputGroupInput>
                                    <ErrorsDisplay errors={validationErrors} paths={["body/repo"]}/>
                                </InputGroup>
                            </GroupBox>

                            {ro.releaseNotes.changes.map((ch, index) => {
                                return <React.Fragment key={ch.prUrl}>

                                    <GroupBox label={<>
                                        <FlexRow $gap={10}>
                                            <h3>`Change #${index + 1}`</h3>

                                            <Button
                                                onClick={() => {
                                                    setRo(rod => {
                                                        const a = rod.releaseNotes.changes;
                                                        if (index > 0 && index < a.length) {
                                                            [a[index - 1], a[index]] = [a[index], a[index - 1]];
                                                        }
                                                    });
                                                }}
                                            >
                                                ⬆️ Up
                                            </Button>
                                            <Button
                                                onClick={() => {
                                                    setRo(rod => {
                                                        const a = rod.releaseNotes.changes;
                                                        if (index >= 0 && index < a.length - 1) {
                                                            [a[index], a[index + 1]] = [a[index + 1], a[index]];
                                                        }
                                                    });
                                                }}
                                            >
                                                ⬇️ Down
                                            </Button>
                                            <Button
                                                disabled={ro.releaseNotes.changes.length <= 1}
                                                style={{backgroundColor: "tomato"}}
                                                onClick={() => {
                                                    setRo(rod => {
                                                        if (rod.releaseNotes.changes.length > 1) rod.releaseNotes.changes.splice(index, 1);
                                                    });
                                                }}
                                            >
                                                Delete
                                            </Button>

                                        </FlexRow>
                                    </>} style={{marginTop: 30}}>
                                        <InputGroup>
                                            <InputGroupName>Title</InputGroupName>
                                            <InputGroupInput>
                                                <TextInputWrapper
                                                    derivedValue={ch.title}
                                                    multiline={true}
                                                    handleChange={title => {
                                                        setRo((rod) => {
                                                            rod.releaseNotes.changes[index].title = title;
                                                        });
                                                    }}
                                                    fullWidth
                                                />
                                            </InputGroupInput>
                                            <ErrorsDisplay errors={validationErrors}
                                                           paths={[`body/releaseNotes/changes/${index}/title`]}/>

                                            <InputGroupName>Body</InputGroupName>
                                            <InputGroupInput>
                                                <TextInputWrapper
                                                    derivedValue={ch.body}
                                                    multiline={true}
                                                    style={{height: 160}}
                                                    handleChange={body => {
                                                        setRo((rod) => {
                                                            rod.releaseNotes.changes[index].body = body;
                                                        });
                                                    }}
                                                    fullWidth
                                                />
                                            </InputGroupInput>
                                            <ErrorsDisplay errors={validationErrors}
                                                           paths={[`body/releaseNotes/changes/${index}/body`]}/>

                                            <InputGroupName>PR Link</InputGroupName>
                                            <InputGroupInput>
                                                <TextInputWrapper
                                                    derivedValue={ch.prUrl}
                                                    handleChange={prUrl => {
                                                        setRo((rod) => {
                                                            rod.releaseNotes.changes[index].prUrl = prUrl;
                                                        });
                                                    }}
                                                    fullWidth
                                                />
                                            </InputGroupInput>
                                            <ErrorsDisplay errors={validationErrors}
                                                           paths={[`body/releaseNotes/changes/${index}/prUrl`]}/>

                                            <InputGroupName>JIRA Issues</InputGroupName>
                                            <InputGroupInput>
                                                <StringsArrayEditor
                                                    entityName={"JIRA Issue"}
                                                    errorsPath={`body/releaseNotes/changes/${index}/jiraUrls`}
                                                    setErrros={setValidationErrors}
                                                    errors={validationErrors}
                                                    array={ro.releaseNotes.changes[index].jiraUrls}
                                                    onUpdate={jiraUrls => {
                                                        setRo((rod) => {
                                                            rod.releaseNotes.changes[index].jiraUrls = jiraUrls;
                                                        });
                                                    }}
                                                    extract={jiraUrl => jiraUrl.url}
                                                    contract={val => {
                                                        const issueId = extractJiraIssueIdFromURL(val);

                                                        if (issueId) {
                                                            return {url: val, issueId};
                                                        } else {
                                                            return undefined;
                                                        }
                                                    }}
                                                    newItem={{
                                                        url: "https://some.atlassian.net/browse/ISSUE-31337",
                                                        issueId: "ISSUE-31337"
                                                    }}
                                                />
                                            </InputGroupInput>

                                            <InputGroupName>Demo Links</InputGroupName>
                                            <InputGroupInput>
                                                <StringsArrayEditor
                                                    entityName={"Demo link"}
                                                    errors={validationErrors}
                                                    setErrros={setValidationErrors}
                                                    errorsPath={`body/releaseNotes/changes/${index}/demoUrls`}
                                                    array={ro.releaseNotes.changes[index].demoUrls}
                                                    onUpdate={demoUrls => {
                                                        setRo((rod) => {
                                                            rod.releaseNotes.changes[index].demoUrls = demoUrls;
                                                        });
                                                    }}
                                                    extract={demoUrl => demoUrl}
                                                    contract={val => val}
                                                    newItem={"https://www.google.com"}
                                                />
                                            </InputGroupInput>

                                        </InputGroup>
                                    </GroupBox>

                                </React.Fragment>;
                            })}

                            <Button onClick={() => {
                                setRo((rod) => {
                                    rod.releaseNotes.changes.push({
                                        title: "Awesome change",
                                        body: "Lorem Ipsum",
                                        demoUrls: [],
                                        jiraUrls: [],
                                        prUrl: `https://github.com/${ro.repo}/pull/31337`,
                                        prNumber: 31337
                                    });
                                });
                            }}>
                                + Add Change
                            </Button>

                            <Actions save={save}/>

                            <GroupBox label="Contributors">
                                <StringsArrayEditor
                                    array={ro.releaseNotes.contributors}
                                    errors={validationErrors}
                                    setErrros={setValidationErrors}
                                    errorsPath={`body/releaseNotes/contributors`}
                                    extract={contributor => contributor}
                                    contract={val => val}
                                    newItem={"rgb2hsl"}
                                    onUpdate={contributors => {
                                        setRo(rod => {
                                            rod.releaseNotes.contributors = contributors;
                                        });
                                    }}
                                    entityName={"Cotributor"}
                                />
                            </GroupBox>

                            <Actions save={save}/>

                            {validationErrors.length ? <GroupBox label={"All Errors"}>
                                <ErrorsDisplay errors={validationErrors}/>
                            </GroupBox> : null}

                        </FlexCol>
                    </WindowContent>
                </Window>
            </ItemCenter>
        </Container>
    </>;
};
export const PageReleaseEdit: React.FC = () => {
    const releaseObjectLoaded: ReleaseObject | null = useLoaderData() as Awaited<ReturnType<typeof releaseEditLoader>>;
    return releaseObjectLoaded ? <ReleaseEditor releaseObject={releaseObjectLoaded}/> : null;
};
