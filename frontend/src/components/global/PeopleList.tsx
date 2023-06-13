import { apiClient } from "@/lib/apiclient/client";
import React, { useEffect, useState } from "react";
import { useQuery } from "react-query";
import { Skeleton } from "../ui/skeleton";

type Person = User & { online: boolean };

type FilterListProps = {
  peopleList: Person[];
};

type PeopleListItemProps = {
  person: Person;
};

const useSplitOnlineUsers = (peopleList: Person[]) => {
  const onlineList: React.ReactNode[] = [];
  const offlineList: React.ReactNode[] = [];

  for (let i = 0; i < peopleList.length; i++) {
    const person = peopleList[i];
    const item = <PeopleListItem key={person.userId} person={person} />;

    if (person.online) {
      onlineList.push(item);
    } else {
      offlineList.push(<div className="opacity-70">{item}</div>);
    }
  }

  return {
    onlineList,
    offlineList,
  };
};

const PeopleListItem = ({ person }: PeopleListItemProps) => {
  return (
    <div className="flex items-center space-x-4 cursor-pointer">
      <div>
        <img
          className="w-[38px] h-[38px] rounded-full object-cover"
          src={person?.avatarUrl}
        />
      </div>
      <div className="flex flex-col item-start ">
        <span className="text-lg font-semibold">{person?.userName}</span>
        <span className="text-sm hover:underline">hangin out in whats...</span>
      </div>
    </div>
  );
};

const PeopleListItemSkeleton = () => {
  return (
    <div className="flex items-center space-x-4">
      <Skeleton className="h-12 w-12 rounded-full bg-app_bg_deep" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[150px] rounded-sm bg-app_bg_deep" />
        <Skeleton className="h-4 w-[100px] rounded-sm bg-app_bg_deep" />
      </div>
    </div>
  );
};

const FilterList = ({ peopleList }: FilterListProps) => {
  const { onlineList, offlineList } = useSplitOnlineUsers(peopleList);
  return (
    <div className="space-y-3">
      {onlineList.length > 0 && (
        <div className="space-y-3">
          <span className="text-sm font-semibold opacity-75">Online</span>
          <div className="space-y-3">{onlineList}</div>
        </div>
      )}

      {offlineList.length > 0 && (
        <div className="space-y-3">
          <span className="text-sm font-semibold opacity-75">Offline</span>
          <div className="space-y-3">{offlineList}</div>
        </div>
      )}
    </div>
  );
};

const PeopleList = () => {
  const { isLoading: peopleLoading, data: people } = useQuery({
    queryKey: ["people"],
    queryFn: async () => {
      const { data } = await apiClient.get("/profile/following/onlineList");
      return data;
    },
  });

  return (
    <div className="w-full space-y-3">
      <span className="font-extrabold text-xl">People</span>
      {peopleLoading ? (
        <div className="space-y-4 pt-6">
          {Array.from({ length: 8 }, (_, index) => (
            <PeopleListItemSkeleton key={index} />
          ))}
        </div>
      ) : (
        <FilterList peopleList={people} />
      )}
    </div>
  );
};

export default PeopleList;
