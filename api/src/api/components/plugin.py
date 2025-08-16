from abc import abstractmethod, ABC


class Plugin(ABC):
    @abstractmethod
    def name(self) -> str:
        """
        Retrieves the name of the data source plugin.

        :return: The name of the data source plugin.
        :rtype: str
        """
        pass

    @abstractmethod
    def identifier(self) -> str:
        """
        Retrieves a unique identifier for the data source plugin.

        :return: The unique identifier of the data source plugin.
        :rtype: str
        """
        pass
